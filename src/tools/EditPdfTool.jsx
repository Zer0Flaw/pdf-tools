import { memo, useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { degrees, PDFDocument } from "pdf-lib";
import UpgradeBanner from "../components/UpgradeBanner";
import AdSlot from "../components/AdSlot";
import { getBaseFileName } from "../utils/fileNaming";
import { formatBytes } from "../utils/formatting";
import { formatFeatureFileSize, getFeatureGate } from "../utils/features";
import { trackEvent } from "../utils/analytics";
import { activateOnEnterOrSpace } from "../utils/accessibility";
import { buildPdfPagePreviews, revokePreviewUrls } from "../utils/pdfPagePreviews";
import { editPdfPages, extractEditedPdfPages } from "../utils/pdfPageOperations";
import { validatePdfFile } from "../utils/pdfValidation";

const EDIT_FEATURE = getFeatureGate("edit");
const MAX_FILE_SIZE = EDIT_FEATURE.maxFileSize;
const MAX_FILES = EDIT_FEATURE.maxFiles;
const FILE_SIZE_LIMIT_LABEL = formatFeatureFileSize(MAX_FILE_SIZE);
const MIN_ZOOM = 0.75;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.15;
const MIN_PLACED_OBJECT_WIDTH_RATIO = 0.14;
const MAX_PLACED_OBJECT_WIDTH_RATIO = 0.48;
const DEFAULT_SIGNATURE_WIDTH_RATIO = 0.26;
const DEFAULT_TEXT_WIDTH_RATIO = 0.3;
const DEFAULT_DATE_WIDTH_RATIO = 0.25;
const DEFAULT_INITIALS_WIDTH_RATIO = 0.18;
const SIGNATURE_UPLOAD_MAX_WIDTH = 900;
const SIGNATURE_UPLOAD_MAX_HEIGHT = 280;
const TYPED_SIGNATURE_PADDING_X = 36;
const TYPED_SIGNATURE_PADDING_Y = 24;
const TYPED_SIGNATURE_FONT_SIZE = 68;
const SIGNATURE_FONT_STACK = '"Segoe Script", "Brush Script MT", "Lucida Handwriting", cursive';
const FILL_TEXT_FONT_STACK = '"Segoe UI", "Helvetica Neue", Arial, sans-serif';
const FILL_TEXT_FONT_SIZE = 42;
const FILL_TEXT_PADDING_X = 22;
const FILL_TEXT_PADDING_Y = 18;
const INITIALS_FONT_SIZE = 58;

function normalizeRotation(value) {
  const normalized = value % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

function clampValue(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function clampZoom(value) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number(value.toFixed(2))));
}

function createEditorLocalId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getCurrentDateLabel() {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date());
}

function getDefaultPlacedObjectWidthRatio(type) {
  switch (type) {
    case "initials":
      return DEFAULT_INITIALS_WIDTH_RATIO;
    case "date":
      return DEFAULT_DATE_WIDTH_RATIO;
    case "text":
      return DEFAULT_TEXT_WIDTH_RATIO;
    default:
      return DEFAULT_SIGNATURE_WIDTH_RATIO;
  }
}

function getFillAssetSourceLabel(type, source) {
  if (type === "signature") {
    return source === "upload" ? "Uploaded signature" : "Typed signature";
  }

  if (type === "initials") return "Initials field";
  if (type === "date") return "Date field";
  return "Text field";
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsDataURL(file);
  });
}

function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load image."));
    image.src = src;
  });
}

async function createTypedSignatureAsset(signatureText) {
  const text = signatureText.trim();
  if (!text) {
    throw new Error("Please enter a signature before creating it.");
  }

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas is not supported for typed signatures.");
  }

  context.font = `600 ${TYPED_SIGNATURE_FONT_SIZE}px ${SIGNATURE_FONT_STACK}`;
  const textMetrics = context.measureText(text);
  const textWidth = Math.ceil(textMetrics.width);
  const canvasWidth = Math.max(320, textWidth + TYPED_SIGNATURE_PADDING_X * 2);
  const canvasHeight = 148;

  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  context.clearRect(0, 0, canvasWidth, canvasHeight);
  context.font = `600 ${TYPED_SIGNATURE_FONT_SIZE}px ${SIGNATURE_FONT_STACK}`;
  context.textBaseline = "middle";
  context.textAlign = "left";
  context.fillStyle = "#0f172a";
  context.fillText(text, TYPED_SIGNATURE_PADDING_X, canvasHeight / 2);

  return {
    id: createEditorLocalId("signature-asset"),
    type: "signature",
    source: "typed",
    label: text,
    dataUrl: canvas.toDataURL("image/png"),
    width: canvasWidth,
    height: canvasHeight,
  };
}

async function createTextFillAsset({ type, text }) {
  const normalizedText = text.trim();
  if (!normalizedText) {
    throw new Error("Please enter text before creating this fill item.");
  }

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas is not supported for Fill & Sign text.");
  }

  const isInitials = type === "initials";
  const fontSize = isInitials ? INITIALS_FONT_SIZE : FILL_TEXT_FONT_SIZE;
  const fontFamily = isInitials ? SIGNATURE_FONT_STACK : FILL_TEXT_FONT_STACK;
  const fontWeight = isInitials ? 700 : 600;
  const paddingX = isInitials ? 28 : FILL_TEXT_PADDING_X;
  const paddingY = isInitials ? 20 : FILL_TEXT_PADDING_Y;

  context.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  const textMetrics = context.measureText(normalizedText);
  const textWidth = Math.ceil(textMetrics.width);
  const canvasWidth = Math.max(isInitials ? 180 : 220, textWidth + paddingX * 2);
  const canvasHeight = Math.max(isInitials ? 112 : 96, fontSize + paddingY * 2);

  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  context.clearRect(0, 0, canvasWidth, canvasHeight);
  context.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  context.textBaseline = "middle";
  context.textAlign = "left";
  context.fillStyle = "#0f172a";
  context.fillText(normalizedText, paddingX, canvasHeight / 2);

  return {
    id: createEditorLocalId(`${type}-asset`),
    type,
    source: "typed",
    label: normalizedText,
    dataUrl: canvas.toDataURL("image/png"),
    width: canvasWidth,
    height: canvasHeight,
  };
}

async function createUploadedSignatureAsset(file) {
  const sourceDataUrl = await readFileAsDataUrl(file);
  const image = await loadImageElement(sourceDataUrl);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas is not supported for signature uploads.");
  }

  const scale = Math.min(
    1,
    SIGNATURE_UPLOAD_MAX_WIDTH / image.naturalWidth,
    SIGNATURE_UPLOAD_MAX_HEIGHT / image.naturalHeight,
  );

  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  return {
    id: createEditorLocalId("signature-asset"),
    type: "signature",
    source: "upload",
    label: getBaseFileName(file.name),
    dataUrl: canvas.toDataURL("image/png"),
    width: canvas.width,
    height: canvas.height,
  };
}

function mapScreenDeltaToPageDelta(deltaX, deltaY, rotation, zoomLevel) {
  const normalizedRotation = normalizeRotation(rotation);
  const zoom = zoomLevel || 1;
  const scaledX = deltaX / zoom;
  const scaledY = deltaY / zoom;

  switch (normalizedRotation) {
    case 90:
      return { deltaX: scaledY, deltaY: -scaledX };
    case 180:
      return { deltaX: -scaledX, deltaY: -scaledY };
    case 270:
      return { deltaX: -scaledY, deltaY: scaledX };
    default:
      return { deltaX: scaledX, deltaY: scaledY };
  }
}

function getPlacedObjectHeightRatio(placedObject, asset, pageWidth, pageHeight) {
  if (!placedObject || !asset || !pageWidth || !pageHeight || !asset.width || !asset.height) {
    return 0;
  }

  const objectWidth = pageWidth * placedObject.widthRatio;
  const objectHeight = objectWidth * (asset.height / asset.width);
  return objectHeight / pageHeight;
}

async function buildFlattenedPdfWithFillObjects(bytes, pageStates, fillAssets, placedObjects) {
  const exportablePages = pageStates.filter((page) => !page.markedForDeletion);
  const sourcePdf = await PDFDocument.load(bytes);
  const nextPdf = await PDFDocument.create();
  const copiedPages = await nextPdf.copyPages(
    sourcePdf,
    exportablePages.map((page) => page.pageNumber - 1),
  );
  const fillAssetMap = new Map(fillAssets.map((asset) => [asset.id, asset]));
  const embeddedImageCache = new Map();

  async function getEmbeddedImage(asset) {
    if (embeddedImageCache.has(asset.id)) {
      return embeddedImageCache.get(asset.id);
    }

    const imageBytes = await fetch(asset.dataUrl).then((response) => response.arrayBuffer());
    const embeddedImage = await nextPdf.embedPng(imageBytes);
    embeddedImageCache.set(asset.id, embeddedImage);
    return embeddedImage;
  }

  for (let index = 0; index < copiedPages.length; index += 1) {
    const nextPage = copiedPages[index];
    const pageState = exportablePages[index];
    const { width: pageWidth, height: pageHeight } = nextPage.getSize();
    const pagePlacedObjects = placedObjects.filter(
      (placedObject) => placedObject.pageNumber === pageState.pageNumber,
    );

    for (const placedObject of pagePlacedObjects) {
      const asset = fillAssetMap.get(placedObject.assetId);
      if (!asset) continue;

      const embeddedImage = await getEmbeddedImage(asset);
      const objectWidth = pageWidth * placedObject.widthRatio;
      const objectHeight = objectWidth * (asset.height / asset.width);
      const x = clampValue(placedObject.xRatio, 0, 1) * pageWidth;
      const yFromTop = clampValue(placedObject.yRatio, 0, 1) * pageHeight;
      const y = pageHeight - yFromTop - objectHeight;

      nextPage.drawImage(embeddedImage, {
        x: clampValue(x, 0, Math.max(0, pageWidth - objectWidth)),
        y: clampValue(y, 0, Math.max(0, pageHeight - objectHeight)),
        width: objectWidth,
        height: objectHeight,
      });
    }

    nextPage.setRotation(degrees(pageState.rotation || 0));
    nextPdf.addPage(nextPage);
  }

  return nextPdf.save();
}

function createInitialEditorState() {
  return {
    pages: [],
    selectedPages: [],
    activePageNumber: null,
    fillAssets: [],
    placedObjects: [],
    selectedPlacedObjectId: null,
    zoomLevel: 1,
    isPageSwitching: false,
    dragState: {
      activeId: null,
      overId: null,
      completedId: null,
      completedOverId: null,
    },
  };
}

function editPdfEditorReducer(state, action) {
  switch (action.type) {
    case "reset":
      return createInitialEditorState();
    case "initialize_document":
      return {
        ...createInitialEditorState(),
        pages: action.pages,
        selectedPages: action.selectedPages,
        activePageNumber: action.activePageNumber,
      };
    case "add_fill_asset":
      return {
        ...state,
        fillAssets: [action.asset, ...state.fillAssets],
      };
    case "add_placed_object":
      return {
        ...state,
        placedObjects: [...state.placedObjects, action.placedObject],
        selectedPlacedObjectId: action.placedObject.id,
      };
    case "update_placed_object":
      return {
        ...state,
        placedObjects: state.placedObjects.map((placedObject) =>
          placedObject.id === action.objectId
            ? { ...placedObject, ...action.updates }
            : placedObject,
        ),
      };
    case "remove_placed_object":
      return {
        ...state,
        placedObjects: state.placedObjects.filter(
          (placedObject) => placedObject.id !== action.objectId,
        ),
        selectedPlacedObjectId:
          state.selectedPlacedObjectId === action.objectId
            ? null
            : state.selectedPlacedObjectId,
      };
    case "set_selected_placed_object":
      return state.selectedPlacedObjectId === action.objectId
        ? state
        : { ...state, selectedPlacedObjectId: action.objectId };
    case "set_active_page":
      return state.activePageNumber === action.pageNumber
        ? state
        : { ...state, activePageNumber: action.pageNumber };
    case "update_selected_pages": {
      const nextSelectedPages = action.updater(state.selectedPages);
      return nextSelectedPages === state.selectedPages
        ? state
        : { ...state, selectedPages: nextSelectedPages };
    }
    case "set_selected_pages":
      return state.selectedPages === action.selectedPages
        ? state
        : { ...state, selectedPages: action.selectedPages };
    case "update_pages": {
      const nextPages = action.updater(state.pages);
      return nextPages === state.pages ? state : { ...state, pages: nextPages };
    }
    case "set_pages":
      return state.pages === action.pages ? state : { ...state, pages: action.pages };
    case "set_zoom_level":
      return state.zoomLevel === action.zoomLevel
        ? state
        : { ...state, zoomLevel: action.zoomLevel };
    case "set_page_switching":
      return state.isPageSwitching === action.value
        ? state
        : { ...state, isPageSwitching: action.value };
    case "begin_drag":
      return {
        ...state,
        dragState: {
          ...state.dragState,
          activeId: action.activeId,
          overId: action.activeId,
          completedId: null,
          completedOverId: null,
        },
      };
    case "update_drag_over":
      return state.dragState.overId === action.overId
        ? state
        : {
            ...state,
            dragState: {
              ...state.dragState,
              overId: action.overId,
            },
          };
    case "reset_drag_state":
      return state.dragState.activeId === null && state.dragState.overId === null
        ? state
        : {
            ...state,
            dragState: {
              ...state.dragState,
              activeId: null,
              overId: null,
            },
          };
    case "set_reorder_feedback":
      return {
        ...state,
        dragState: {
          activeId: null,
          overId: null,
          completedId: action.completedId,
          completedOverId: action.completedOverId,
        },
      };
    case "clear_reorder_feedback":
      return state.dragState.completedId === null &&
        state.dragState.completedOverId === null
        ? state
        : {
            ...state,
            dragState: {
              ...state.dragState,
              completedId: null,
              completedOverId: null,
            },
          };
    case "reorder_pages": {
      const oldIndex = state.pages.findIndex((page) => page.id === action.activeId);
      const newIndex = state.pages.findIndex((page) => page.id === action.overId);

      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
        return state;
      }

      return {
        ...state,
        pages: arrayMove(state.pages, oldIndex, newIndex),
      };
    }
    default:
      return state;
  }
}

const SortableThumbnailPage = memo(function SortableThumbnailPage({
  page,
  index,
  totalPages,
  isActive,
  isSelected,
  isDropTarget,
  isBatchDragActive,
  isDropComplete,
  onActivate,
  onToggleSelection,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.id });

  const style = useMemo(
    () => ({
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.68 : 1,
    }),
    [isDragging, transform, transition],
  );

  function handleActivate(event = {}) {
    onActivate(page.pageNumber, { shiftKey: Boolean(event.shiftKey) });
  }

  const thumbnailMetaLabel = page.markedForDeletion
    ? "Deleted from export"
    : isDropComplete
      ? "Moved into place"
      : isDropTarget
        ? "Release to place here"
        : `Position ${index + 1} of ${totalPages}`;

  return (
    <article
      ref={setNodeRef}
      style={style}
      data-page-number={page.pageNumber}
      className={`edit-pdf-thumb ${isActive ? "active" : ""} ${
        isSelected ? "selected" : ""
      } ${isDropTarget ? "drop-target" : ""} ${
        isBatchDragActive ? "batch-dragging" : ""
      } ${isDropComplete ? "drop-complete" : ""} ${
        page.markedForDeletion ? "deleted" : ""
      } ${
        isDragging ? "dragging" : ""
      }`}
      aria-current={isActive ? "page" : undefined}
      onClick={handleActivate}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleActivate();
        }
      }}
    >
      <div className="edit-pdf-thumb-top">
        <button
          type="button"
          className="edit-pdf-thumb-handle"
          aria-label={`Drag page ${page.pageNumber} to reorder`}
          onClick={(event) => event.stopPropagation()}
          {...attributes}
          {...listeners}
        >
          Reorder
        </button>
        <label
          className="edit-pdf-thumb-check"
          onClick={(event) => event.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(event) =>
              onToggleSelection(page.pageNumber, {
                shiftKey: event.nativeEvent.shiftKey,
              })
            }
          />
          <span>Select</span>
        </label>
      </div>

      <div className="edit-pdf-thumb-preview">
        <img
          className="edit-pdf-thumb-image"
          src={page.previewUrl}
          alt={`Preview of PDF page ${page.pageNumber}`}
          loading="lazy"
          decoding="async"
          style={{ transform: `rotate(${page.rotation}deg)` }}
        />
      </div>

      <div className="edit-pdf-thumb-meta">
        <strong>Page {page.pageNumber}</strong>
        <span>{thumbnailMetaLabel}</span>
      </div>
    </article>
  );
}, areThumbnailPropsEqual);

function areThumbnailPropsEqual(prevProps, nextProps) {
  return (
    prevProps.page === nextProps.page &&
    prevProps.index === nextProps.index &&
    prevProps.totalPages === nextProps.totalPages &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isDropTarget === nextProps.isDropTarget &&
    prevProps.isBatchDragActive === nextProps.isBatchDragActive &&
    prevProps.isDropComplete === nextProps.isDropComplete
  );
}

export default function EditPdfTool() {
  const toolRootRef = useRef(null);
  const thumbnailListRef = useRef(null);
  const signatureUploadInputRef = useRef(null);
  const pageStageRef = useRef(null);
  const pageSwitchTimeoutRef = useRef(null);
  const previousActivePageRef = useRef(null);
  const placedObjectDragRef = useRef(null);
  const placedObjectDragFrameRef = useRef(null);
  const [file, setFile] = useState(null);
  const [typedSignatureValue, setTypedSignatureValue] = useState("");
  const [fillTextValue, setFillTextValue] = useState("");
  const [dateValue, setDateValue] = useState(getCurrentDateLabel);
  const [initialsValue, setInitialsValue] = useState("");
  const [isPreparingFillAsset, setIsPreparingFillAsset] = useState(false);
  const [draggingPlacedObjectId, setDraggingPlacedObjectId] = useState(null);
  const [editorState, dispatchEditorState] = useReducer(
    editPdfEditorReducer,
    undefined,
    createInitialEditorState,
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showExportAd, setShowExportAd] = useState(false);
  const fileInputRef = useRef(null);
  const previewUrlsRef = useRef([]);
  const pageNumberIndexRef = useRef(new Map());
  const selectionAnchorPageRef = useRef(null);
  const isPremium = false;
  const {
    pages,
    selectedPages,
    activePageNumber,
    fillAssets,
    placedObjects,
    selectedPlacedObjectId,
    zoomLevel,
    isPageSwitching,
    dragState,
  } = editorState;
  const selectedPageSet = useMemo(() => new Set(selectedPages), [selectedPages]);
  const fillAssetMap = useMemo(
    () => new Map(fillAssets.map((asset) => [asset.id, asset])),
    [fillAssets],
  );
  const railDerivedState = useMemo(() => {
    const pageIds = [];
    const pageIdMap = new Map();
    const pageNumberMap = new Map();
    const includedPages = [];
    const selectedIncludedPages = [];
    const selectedRailPages = [];
    let activeRailPage = null;
    let activeRailPageIndex = -1;
    let deletedCount = 0;

    pages.forEach((page, index) => {
      pageIds.push(page.id);
      pageIdMap.set(page.id, page);
      pageNumberMap.set(page.pageNumber, page);

      if (page.pageNumber === activePageNumber) {
        activeRailPage = page;
        activeRailPageIndex = index;
      }

      if (page.markedForDeletion) {
        deletedCount += 1;
      } else {
        includedPages.push(page);
      }

      if (selectedPageSet.has(page.pageNumber)) {
        selectedRailPages.push(page);

        if (!page.markedForDeletion) {
          selectedIncludedPages.push(page);
        }
      }
    });

    if (!activeRailPage && pages.length) {
      activeRailPage = pages[0];
      activeRailPageIndex = 0;
    }

    const selectedPageIds = selectedRailPages.map((page) => page.id);

    return {
      pageIds,
      pageIdMap,
      pageNumberMap,
      includedPages,
      selectedIncludedPages,
      selectedRailSelection: {
        count: selectedRailPages.length,
        pageIds: selectedPageIds,
        includedCount: selectedIncludedPages.length,
      },
      activeRailState: {
        page: activeRailPage,
        isSelected: activeRailPage
          ? selectedPageSet.has(activeRailPage.pageNumber)
          : false,
        position: activeRailPageIndex === -1 ? 0 : activeRailPageIndex + 1,
      },
      deletedCount,
    };
  }, [activePageNumber, pages, selectedPageSet]);
  const {
    pageIds,
    pageIdMap,
    pageNumberMap,
    includedPages,
    selectedIncludedPages,
    selectedRailSelection,
    activeRailState,
    deletedCount,
  } = railDerivedState;
  const placedObjectMap = useMemo(
    () => new Map(placedObjects.map((placedObject) => [placedObject.id, placedObject])),
    [placedObjects],
  );
  const activePagePlacedObjects = useMemo(
    () =>
      activePageNumber === null
        ? []
        : placedObjects.filter((placedObject) => placedObject.pageNumber === activePageNumber),
    [activePageNumber, placedObjects],
  );
  const selectedPlacedObject = selectedPlacedObjectId
    ? placedObjectMap.get(selectedPlacedObjectId) || null
    : null;
  const selectedPlacedObjectAsset = selectedPlacedObject
    ? fillAssetMap.get(selectedPlacedObject.assetId) || null
    : null;
  const railDragState = useMemo(() => {
    if (!dragState.activeId) {
      return {
        activeId: null,
        completedId: dragState.completedId,
        activePage: null,
        overId: dragState.overId,
        overPage: null,
        isBatchCandidate: false,
        isDragging: false,
        completedPage: dragState.completedId ? pageIdMap.get(dragState.completedId) || null : null,
        completedTargetPage: dragState.completedOverId
          ? pageIdMap.get(dragState.completedOverId) || null
          : null,
        selectedPageIds: [],
        selectedCount: 0,
      };
    }

    const activePage = pageIdMap.get(dragState.activeId) || null;
    const overPage = dragState.overId ? pageIdMap.get(dragState.overId) || null : null;
    const isBatchCandidate = activePage
      ? selectedPageSet.has(activePage.pageNumber)
      : false;

    return {
      activeId: dragState.activeId,
      completedId: dragState.completedId,
      activePage,
      overId: dragState.overId,
      overPage,
      isBatchCandidate,
      isDragging: true,
      completedPage: dragState.completedId ? pageIdMap.get(dragState.completedId) || null : null,
      completedTargetPage: dragState.completedOverId
        ? pageIdMap.get(dragState.completedOverId) || null
        : null,
      selectedPageIds: isBatchCandidate ? selectedRailSelection.pageIds : [],
      selectedCount: isBatchCandidate ? selectedRailSelection.count : 0,
    };
  }, [
    dragState.activeId,
    dragState.completedId,
    dragState.completedOverId,
    dragState.overId,
    pageIdMap,
    selectedPageSet,
    selectedRailSelection,
  ]);

  useEffect(() => {
    previewUrlsRef.current = pages;
    pageNumberIndexRef.current = new Map(
      pages.map((page, index) => [page.pageNumber, index]),
    );
  }, [pages]);

  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      setMessage(null);
    }, 3500);

    return () => clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    if (!dragState.completedId) return undefined;

    const timer = setTimeout(() => {
      dispatchEditorState({ type: "clear_reorder_feedback" });
    }, 900);

    return () => clearTimeout(timer);
  }, [dragState.completedId]);

  useEffect(() => {
    return () => {
      revokePreviewUrls(previewUrlsRef.current);
      if (pageSwitchTimeoutRef.current) {
        clearTimeout(pageSwitchTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!pages.length) {
      if (activePageNumber !== null) {
        dispatchEditorState({ type: "set_active_page", pageNumber: null });
      }
      return;
    }

    if (!pageNumberMap.has(activePageNumber)) {
      dispatchEditorState({ type: "set_active_page", pageNumber: pages[0].pageNumber });
    }
  }, [activePageNumber, pageNumberMap, pages]);

  useEffect(() => {
    if (!activePageNumber || !pages.length) return;

    const activeThumbnail = thumbnailListRef.current?.querySelector(
      `[data-page-number="${activePageNumber}"]`,
    );
    activeThumbnail?.scrollIntoView({
      block: "nearest",
      behavior: previousActivePageRef.current === null ? "auto" : "smooth",
    });

    if (
      previousActivePageRef.current !== null &&
      previousActivePageRef.current !== activePageNumber
    ) {
      dispatchEditorState({ type: "set_page_switching", value: true });
      if (pageSwitchTimeoutRef.current) {
        clearTimeout(pageSwitchTimeoutRef.current);
      }
      pageSwitchTimeoutRef.current = setTimeout(() => {
        dispatchEditorState({ type: "set_page_switching", value: false });
        pageSwitchTimeoutRef.current = null;
      }, 260);
    }

    previousActivePageRef.current = activePageNumber;
  }, [activePageNumber, pages.length]);

  useEffect(() => {
    if (
      selectedPlacedObject &&
      activePageNumber !== null &&
      selectedPlacedObject.pageNumber !== activePageNumber
    ) {
      dispatchEditorState({
        type: "set_selected_placed_object",
        objectId: null,
      });
    }
  }, [activePageNumber, selectedPlacedObject]);

  useEffect(() => {
    return () => {
      if (placedObjectDragFrameRef.current) {
        cancelAnimationFrame(placedObjectDragFrameRef.current);
      }
    };
  }, []);

  function resetLoadedDocumentState() {
    revokePreviewUrls(previewUrlsRef.current);
    previewUrlsRef.current = [];
    dispatchEditorState({ type: "reset" });
    previousActivePageRef.current = null;
    if (pageSwitchTimeoutRef.current) {
      clearTimeout(pageSwitchTimeoutRef.current);
      pageSwitchTimeoutRef.current = null;
    }
    selectionAnchorPageRef.current = null;
  }

  function setSelectedFile(nextFile) {
    setFile(nextFile);
    resetLoadedDocumentState();
    setShowExportAd(false);
  }

  function validatePdf(selectedFile) {
    const result = validatePdfFile(selectedFile, MAX_FILE_SIZE, isPremium);

    if (!result.isValid && result.reason === "file_type") {
      setMessage({ type: "error", text: result.message });
      return false;
    }

    if (!result.isValid && result.reason === "file_size_limit") {
      trackEvent("free_limit_encountered", {
        tool: "edit",
        file_count: 1,
        input_type: "pdf",
        gated_feature: "file_size_limit",
      });
      setMessage({
        type: "error",
        text: `File exceeds ${FILE_SIZE_LIMIT_LABEL} limit for free users.`,
      });
      return false;
    }

    return true;
  }

  function handleSelectedFile(selectedFile) {
    if (!selectedFile) return;
    if (!validatePdf(selectedFile)) return;

    setSelectedFile(selectedFile);
    setMessage(null);
    trackEvent("file_uploaded", {
      tool: "edit",
      file_count: 1,
      input_type: "pdf",
    });
  }

  function handleFileChange(event) {
    handleSelectedFile(event.target.files?.[0]);
    event.target.value = "";
  }

  function handleUploadDragOver(event) {
    if (isProcessing) return;
    event.preventDefault();
    setIsDragOver(true);
  }

  function handleDragLeave(event) {
    event.preventDefault();
    setIsDragOver(false);
  }

  function handleDrop(event) {
    if (isProcessing) return;
    event.preventDefault();
    setIsDragOver(false);
    handleSelectedFile(event.dataTransfer.files?.[0]);
  }

  function clearSelectedFile() {
    if (!file) return;

    setFile(null);
    resetLoadedDocumentState();
    setShowExportAd(false);
    setMessage(null);
  }

  async function loadPdfPages() {
    if (!file || isProcessing) return;

    setIsProcessing(true);
    setShowExportAd(false);
    setMessage(null);
    resetLoadedDocumentState();

    try {
      const bytes = await file.arrayBuffer();
      const previewPages = await buildPdfPagePreviews(bytes);
      const nextPages = previewPages.map((page) => ({
        ...page,
        id: `page-${page.pageNumber}`,
        rotation: 0,
        markedForDeletion: false,
      }));

      dispatchEditorState({
        type: "initialize_document",
        pages: nextPages,
        selectedPages: nextPages.map((page) => page.pageNumber),
        activePageNumber: nextPages[0]?.pageNumber ?? null,
      });
      setMessage({
        type: "success",
        text: `Ready to edit ${nextPages.length} page${nextPages.length === 1 ? "" : "s"}.`,
      });
    } catch {
      setMessage({
        type: "error",
        text: "Something went wrong while loading your PDF pages.",
      });
    } finally {
      setIsProcessing(false);
    }
  }

  const togglePageSelection = useCallback((pageNumber, options = {}) => {
    const { shiftKey = false } = options;
    const anchorPageNumber = selectionAnchorPageRef.current;

    if (shiftKey && anchorPageNumber !== null && anchorPageNumber !== pageNumber) {
      const currentPages = previewUrlsRef.current;
      const pageNumberIndexMap = pageNumberIndexRef.current;
      const anchorIndex = pageNumberIndexMap.get(anchorPageNumber) ?? -1;
      const targetIndex = pageNumberIndexMap.get(pageNumber) ?? -1;

      if (anchorIndex !== -1 && targetIndex !== -1) {
        const rangePageNumbers = currentPages
          .slice(
            Math.min(anchorIndex, targetIndex),
            Math.max(anchorIndex, targetIndex) + 1,
          )
          .map((page) => page.pageNumber);

        dispatchEditorState({
          type: "update_selected_pages",
          updater: (prev) =>
            Array.from(new Set([...prev, ...rangePageNumbers])).sort((a, b) => a - b),
        });
        selectionAnchorPageRef.current = pageNumber;
        return;
      }
    }

    selectionAnchorPageRef.current = pageNumber;
    dispatchEditorState({
      type: "update_selected_pages",
      updater: (prev) =>
        prev.includes(pageNumber)
          ? prev.filter((value) => value !== pageNumber)
          : [...prev, pageNumber].sort((a, b) => a - b),
    });
  }, []);

  const handleThumbnailActivate = useCallback((pageNumber, options = {}) => {
    const { shiftKey = false } = options;
    dispatchEditorState({ type: "set_active_page", pageNumber });
    if (shiftKey) {
      togglePageSelection(pageNumber, { shiftKey: true });
      return;
    }
    selectionAnchorPageRef.current = pageNumber;
  }, [togglePageSelection]);

  const resetDragState = useCallback(() => {
    dispatchEditorState({ type: "reset_drag_state" });
  }, []);

  function selectAllPages() {
    dispatchEditorState({
      type: "set_selected_pages",
      selectedPages: pages.map((page) => page.pageNumber),
    });
    selectionAnchorPageRef.current = pages[0]?.pageNumber ?? null;
  }

  function clearPageSelection() {
    dispatchEditorState({ type: "set_selected_pages", selectedPages: [] });
    selectionAnchorPageRef.current = null;
  }

  function rotatePage(pageNumber, delta) {
    dispatchEditorState({
      type: "update_pages",
      updater: (prev) =>
        prev.map((page) =>
          page.pageNumber === pageNumber
            ? { ...page, rotation: normalizeRotation(page.rotation + delta) }
            : page,
        ),
    });
  }

  function rotateActivePage(delta) {
    if (activePageNumber === null) return;
    rotatePage(activePageNumber, delta);
  }

  function adjustZoom(delta) {
    dispatchEditorState({
      type: "set_zoom_level",
      zoomLevel: clampZoom(zoomLevel + delta),
    });
  }

  function resetZoom() {
    dispatchEditorState({ type: "set_zoom_level", zoomLevel: 1 });
  }

  function rotateSelectedPages(delta) {
    if (!selectedPages.length) return;
    const selectedPageNumbers = new Set(selectedPages);

    dispatchEditorState({
      type: "update_pages",
      updater: (prev) =>
        prev.map((page) =>
          selectedPageNumbers.has(page.pageNumber)
            ? { ...page, rotation: normalizeRotation(page.rotation + delta) }
            : page,
        ),
    });
  }

  function updateDeletionState(targetPageNumbers, markedForDeletion) {
    if (!targetPageNumbers.length) return;
    const targetPageNumberSet = new Set(targetPageNumbers);

    const nextPages = pages.map((page) =>
      targetPageNumberSet.has(page.pageNumber)
        ? { ...page, markedForDeletion }
        : page,
    );

    if (!nextPages.some((page) => !page.markedForDeletion)) {
      setMessage({
        type: "error",
        text: "At least one page must remain in the edited PDF.",
      });
      return;
    }

    dispatchEditorState({ type: "set_pages", pages: nextPages });
    setMessage(null);
  }

  function markSelectedForDeletion() {
    updateDeletionState(selectedPages, true);
  }

  function keepSelectedPages() {
    updateDeletionState(selectedPages, false);
  }

  function toggleDeletionForPage(pageNumber) {
    const targetPage = pageNumberMap.get(pageNumber);
    if (!targetPage) return;

    updateDeletionState([pageNumber], !targetPage.markedForDeletion);
  }

  function toggleActivePageDeletion() {
    if (activePageNumber === null) return;
    toggleDeletionForPage(activePageNumber);
  }

  async function handleCreateTypedSignature() {
    if (isPreparingFillAsset) return;

    setIsPreparingFillAsset(true);
    try {
      const asset = await createTypedSignatureAsset(typedSignatureValue);
      dispatchEditorState({ type: "add_fill_asset", asset });
      setTypedSignatureValue("");
      setMessage({
        type: "success",
        text: `Saved signature "${asset.label}" for placement.`,
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error
          ? error.message
          : "Something went wrong while creating your signature.",
      });
    } finally {
      setIsPreparingFillAsset(false);
    }
  }

  async function handleSignatureUpload(event) {
    const selectedFile = event.target.files?.[0];
    event.target.value = "";
    if (!selectedFile || isPreparingFillAsset) return;

    setIsPreparingFillAsset(true);
    try {
      const asset = await createUploadedSignatureAsset(selectedFile);
      dispatchEditorState({ type: "add_fill_asset", asset });
      setMessage({
        type: "success",
        text: `Uploaded signature "${asset.label}" and added it to your signature tray.`,
      });
    } catch {
      setMessage({
        type: "error",
        text: "Something went wrong while processing your uploaded signature.",
      });
    } finally {
      setIsPreparingFillAsset(false);
    }
  }

  async function handleCreateTextObject() {
    if (isPreparingFillAsset) return;

    setIsPreparingFillAsset(true);
    try {
      const asset = await createTextFillAsset({ type: "text", text: fillTextValue });
      dispatchEditorState({ type: "add_fill_asset", asset });
      setFillTextValue("");
      placeFillAssetOnActivePage(asset.id);
      setMessage({
        type: "success",
        text: `Added text "${asset.label}" to page ${activePageNumber}.`,
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error
          ? error.message
          : "Something went wrong while creating this text object.",
      });
    } finally {
      setIsPreparingFillAsset(false);
    }
  }

  async function handleCreateDateObject() {
    if (isPreparingFillAsset) return;

    setIsPreparingFillAsset(true);
    try {
      const asset = await createTextFillAsset({
        type: "date",
        text: dateValue || getCurrentDateLabel(),
      });
      dispatchEditorState({ type: "add_fill_asset", asset });
      placeFillAssetOnActivePage(asset.id);
      setMessage({
        type: "success",
        text: `Added date "${asset.label}" to page ${activePageNumber}.`,
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error
          ? error.message
          : "Something went wrong while creating this date object.",
      });
    } finally {
      setIsPreparingFillAsset(false);
    }
  }

  async function handleCreateInitialsObject() {
    if (isPreparingFillAsset) return;

    setIsPreparingFillAsset(true);
    try {
      const asset = await createTextFillAsset({ type: "initials", text: initialsValue });
      dispatchEditorState({ type: "add_fill_asset", asset });
      setInitialsValue("");
      placeFillAssetOnActivePage(asset.id);
      setMessage({
        type: "success",
        text: `Added initials "${asset.label}" to page ${activePageNumber}.`,
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error
          ? error.message
          : "Something went wrong while creating these initials.",
      });
    } finally {
      setIsPreparingFillAsset(false);
    }
  }

  function placeFillAssetOnActivePage(assetId) {
    if (activePageNumber === null) return;
    const asset = fillAssetMap.get(assetId);
    if (!asset) return;

    const existingCount = placedObjects.filter(
      (placedObject) => placedObject.pageNumber === activePageNumber,
    ).length;
    const widthRatio = getDefaultPlacedObjectWidthRatio(asset.type);
    const stageWidth = pageStageRef.current?.clientWidth || 0;
    const stageHeight = pageStageRef.current?.clientHeight || 0;
    const defaultHeightRatio =
      stageWidth && stageHeight
        ? getPlacedObjectHeightRatio(
            { widthRatio },
            asset,
            stageWidth,
            stageHeight,
          )
        : 0.12;
    const nextPlacedObject = {
      id: createEditorLocalId(`placed-${asset.type}`),
      type: asset.type,
      assetId,
      pageNumber: activePageNumber,
      xRatio: clampValue(0.12 + existingCount * 0.03, 0.04, 0.72),
      yRatio: clampValue(0.14 + existingCount * 0.04, 0.06, 1 - defaultHeightRatio - 0.08),
      widthRatio,
    };

    dispatchEditorState({
      type: "add_placed_object",
      placedObject: nextPlacedObject,
    });
    setMessage(null);
  }

  function updateSelectedPlacedObjectWidth(nextWidthRatio) {
    if (!selectedPlacedObject || !selectedPlacedObjectAsset || activePageNumber === null) {
      return;
    }

    const stageWidth = pageStageRef.current?.clientWidth || 1;
    const stageHeight = pageStageRef.current?.clientHeight || 1;
    const widthRatio = clampValue(
      nextWidthRatio,
      MIN_PLACED_OBJECT_WIDTH_RATIO,
      MAX_PLACED_OBJECT_WIDTH_RATIO,
    );
    const nextHeightRatio = getPlacedObjectHeightRatio(
      { widthRatio },
      selectedPlacedObjectAsset,
      stageWidth,
      stageHeight,
    );

    dispatchEditorState({
      type: "update_placed_object",
      objectId: selectedPlacedObject.id,
      updates: {
        widthRatio,
        xRatio: clampValue(selectedPlacedObject.xRatio, 0, 1 - widthRatio),
        yRatio: clampValue(selectedPlacedObject.yRatio, 0, 1 - nextHeightRatio),
      },
    });
  }

  function removeSelectedPlacedObject() {
    if (!selectedPlacedObject) return;
    dispatchEditorState({
      type: "remove_placed_object",
      objectId: selectedPlacedObject.id,
    });
  }

  const handlePlacedObjectPointerMove = useCallback((event) => {
    const dragStateRef = placedObjectDragRef.current;
    if (!dragStateRef) return;

    const { deltaX, deltaY } = mapScreenDeltaToPageDelta(
      event.clientX - dragStateRef.startClientX,
      event.clientY - dragStateRef.startClientY,
      dragStateRef.rotation,
      dragStateRef.zoomLevel,
    );
    const nextXRatio = clampValue(
      dragStateRef.startXRatio + deltaX / dragStateRef.stageWidth,
      0,
      1 - dragStateRef.widthRatio,
    );
    const nextYRatio = clampValue(
      dragStateRef.startYRatio + deltaY / dragStateRef.stageHeight,
      0,
      1 - dragStateRef.heightRatio,
    );

    if (placedObjectDragFrameRef.current) {
      cancelAnimationFrame(placedObjectDragFrameRef.current);
    }

    placedObjectDragFrameRef.current = requestAnimationFrame(() => {
      dispatchEditorState({
        type: "update_placed_object",
        objectId: dragStateRef.objectId,
        updates: {
          xRatio: nextXRatio,
          yRatio: nextYRatio,
        },
      });
    });
  }, []);

  const handlePlacedObjectPointerUp = useCallback(() => {
    window.removeEventListener("pointermove", handlePlacedObjectPointerMove);
    window.removeEventListener("pointerup", handlePlacedObjectPointerUp);
    window.removeEventListener("pointercancel", handlePlacedObjectPointerUp);
    placedObjectDragRef.current = null;
    setDraggingPlacedObjectId(null);

    if (placedObjectDragFrameRef.current) {
      cancelAnimationFrame(placedObjectDragFrameRef.current);
      placedObjectDragFrameRef.current = null;
    }
  }, [handlePlacedObjectPointerMove]);

  function handlePlacedObjectPointerDown(event, placedObject) {
    const fillAsset = fillAssetMap.get(placedObject.assetId);
    if (!fillAsset || activePageNumber === null) return;

    event.preventDefault();
    event.stopPropagation();
    dispatchEditorState({
      type: "set_selected_placed_object",
      objectId: placedObject.id,
    });

    const stageWidth = pageStageRef.current?.clientWidth || 0;
    const stageHeight = pageStageRef.current?.clientHeight || 0;
    if (!stageWidth || !stageHeight) return;

    const heightRatio = getPlacedObjectHeightRatio(
      placedObject,
      fillAsset,
      stageWidth,
      stageHeight,
    );

    placedObjectDragRef.current = {
      objectId: placedObject.id,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startXRatio: placedObject.xRatio,
      startYRatio: placedObject.yRatio,
      widthRatio: placedObject.widthRatio,
      heightRatio,
      stageWidth,
      stageHeight,
      rotation: activePage?.rotation || 0,
      zoomLevel,
    };
    setDraggingPlacedObjectId(placedObject.id);
    window.addEventListener("pointermove", handlePlacedObjectPointerMove);
    window.addEventListener("pointerup", handlePlacedObjectPointerUp);
    window.addEventListener("pointercancel", handlePlacedObjectPointerUp);
  }

  function clearSelectedPlacedObject() {
    dispatchEditorState({
      type: "set_selected_placed_object",
      objectId: null,
    });
  }

  useEffect(() => {
    return () => {
      window.removeEventListener("pointermove", handlePlacedObjectPointerMove);
      window.removeEventListener("pointerup", handlePlacedObjectPointerUp);
      window.removeEventListener("pointercancel", handlePlacedObjectPointerUp);
    };
  }, [handlePlacedObjectPointerMove, handlePlacedObjectPointerUp]);

  const handleDragStart = useCallback((event) => {
    dispatchEditorState({ type: "begin_drag", activeId: event.active.id });
  }, []);

  const handleDragOver = useCallback((event) => {
    dispatchEditorState({
      type: "update_drag_over",
      overId: event.over?.id ?? null,
    });
  }, []);

  const handleDragCancel = useCallback(() => {
    resetDragState();
  }, [resetDragState]);

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      resetDragState();
      return;
    }

    dispatchEditorState({
      type: "set_reorder_feedback",
      completedId: active.id,
      completedOverId: over.id,
    });
    dispatchEditorState({
      type: "reorder_pages",
      activeId: active.id,
      overId: over.id,
    });
  }

  async function downloadPdfDocument(
    pdfBytes,
    downloadName,
    successText,
    metadata = {},
  ) {
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = downloadName;
    link.click();
    URL.revokeObjectURL(url);

    setShowExportAd(true);
    trackEvent("process_completed", {
      tool: "edit",
      file_count: metadata.fileCount,
      input_type: "pdf",
      output_type: "pdf",
      size_bytes: blob.size,
      ...metadata.extra,
    });
    trackEvent("export_downloaded", {
      tool: "edit",
      file_count: metadata.fileCount,
      output_type: "pdf",
      size_bytes: blob.size,
      ...metadata.extra,
    });
    setMessage({
      type: "success",
      text: `${successText} (${formatBytes(blob.size)}).`,
    });
  }

  async function runPdfExport(exporter, onErrorMessage) {
    trackEvent("process_started", {
      tool: "edit",
      file_count: 1,
      input_type: "pdf",
      output_type: "pdf",
    });
    setIsProcessing(true);
    setShowExportAd(false);
    setMessage(null);

    try {
      const bytes = await file.arrayBuffer();
      await exporter(bytes);
    } catch {
      setMessage({
        type: "error",
        text: onErrorMessage,
      });
    } finally {
      setIsProcessing(false);
    }
  }

  async function exportEditedDocument() {
    if (!file || !pages.length || isProcessing) return;

    if (!includedPages.length) {
      setMessage({
        type: "error",
        text: "At least one page must remain in the edited PDF.",
      });
      return;
    }

    await runPdfExport(async (bytes) => {
      const pdfBytes = placedObjects.length
        ? await buildFlattenedPdfWithFillObjects(
            bytes,
            pages,
            fillAssets,
            placedObjects,
          )
        : await editPdfPages(bytes, pages);
      await downloadPdfDocument(
        pdfBytes,
        `${getBaseFileName(file.name)}-edited.pdf`,
        "Edited PDF downloaded successfully",
        {
          fileCount: includedPages.length,
          extra: {
            export_kind: "edited_pdf",
            fill_item_count: placedObjects.length,
          },
        },
      );
    }, "Something went wrong while exporting your edited PDF.");
  }

  async function exportSelectedPages() {
    if (!file || !selectedPages.length || isProcessing) return;

    if (!selectedIncludedPages.length) {
      setMessage({
        type: "error",
        text: "Select at least one page that is still included in the document.",
      });
      return;
    }

    await runPdfExport(async (bytes) => {
      const pdfBytes = placedObjects.length
        ? await buildFlattenedPdfWithFillObjects(
            bytes,
            pages.filter((page) => selectedPages.includes(page.pageNumber)),
            fillAssets,
            placedObjects,
          )
        : await extractEditedPdfPages(bytes, pages, selectedPages);
      await downloadPdfDocument(
        pdfBytes,
        `${getBaseFileName(file.name)}-selected-pages.pdf`,
        "Selected pages downloaded successfully",
        {
          fileCount: selectedIncludedPages.length,
          extra: {
            export_kind: "selected_pages",
            fill_item_count: placedObjects.filter((placedObject) =>
              selectedPages.includes(placedObject.pageNumber),
            ).length,
          },
        },
      );
    }, "Something went wrong while exporting your selected pages.");
  }

  const editorDerivedState = useMemo(() => {
    const activePage = activeRailState.page;
    const remainingCount = pages.length - deletedCount;
    const selectedIncludedCount = selectedIncludedPages.length;
    const selectedDeletedCount = selectedPages.length - selectedIncludedCount;
    const activePageSelected = activeRailState.isSelected;
    const activePageFillObjectCount = activePage
      ? activePagePlacedObjects.length
      : 0;
    const hasSelection = selectedPages.length > 0;
    const hasIncludedSelection = selectedIncludedCount > 0;
    const hasFillAssets = fillAssets.length > 0;
    const selectedPlacedObjectOnActivePage = selectedPlacedObject &&
      activePage &&
      selectedPlacedObject.pageNumber === activePage.pageNumber
        ? selectedPlacedObject
        : null;
    const selectedPlacedObjectTypeLabel = selectedPlacedObjectOnActivePage
      ? selectedPlacedObjectOnActivePage.type === "signature"
        ? "Signature"
        : selectedPlacedObjectOnActivePage.type === "initials"
          ? "Initials"
          : selectedPlacedObjectOnActivePage.type === "date"
            ? "Date"
            : "Text"
      : null;
    const selectedPagesLabel =
      selectedPages.length === 1
        ? "1 selected page"
        : `${selectedPages.length} selected pages`;
    const selectedIncludedLabel =
      selectedIncludedCount === 1
        ? "1 selected in export"
        : `${selectedIncludedCount} selected in export`;
    const batchStatus = !hasSelection
      ? {
          tone: "empty",
          title: "No pages selected",
          text: "Select pages in the rail to enable batch rotation, keep, delete, or extraction.",
        }
      : !hasIncludedSelection
        ? {
            tone: "warning",
            title: "Selection is excluded from export",
            text: "Keep selected pages or reselect included pages before extracting them.",
          }
        : selectedDeletedCount > 0
          ? {
              tone: "mixed",
              title: `${selectedIncludedCount} page${selectedIncludedCount === 1 ? "" : "s"} ready for extraction`,
              text: `${selectedDeletedCount} selected page${selectedDeletedCount === 1 ? " is" : "s are"} currently removed from export.`,
            }
          : {
              tone: "ready",
              title: `${selectedIncludedCount} page${selectedIncludedCount === 1 ? "" : "s"} ready for batch actions`,
              text: "Rotate, keep, delete, or extract the current selection from one command area.",
            };
    const hasLoadedEditor = pages.length > 0 && activePage;
    const activePagePosition = activeRailState.position;
    const activeThumbnailPageNumber = activePage?.pageNumber ?? null;
    const railAssistant = railDragState.isDragging
      ? railDragState.isBatchCandidate
        ? {
            tone: "dragging",
            title: `Dragging a selected page from a ${railDragState.selectedCount}-page selection`,
            text: railDragState.overPage
              ? `Release to place the dragged page near page ${railDragState.overPage.pageNumber}.`
              : "Move through the rail and release to reorder the current selection context.",
          }
        : {
            tone: "dragging",
            title: railDragState.activePage
              ? `Dragging page ${railDragState.activePage.pageNumber}`
              : "Dragging page",
            text: railDragState.overPage
              ? `Release to place it near page ${railDragState.overPage.pageNumber}.`
              : "Move through the rail and release to reorder this page.",
          }
      : railDragState.completedPage
        ? {
            tone: "complete",
            title: `Moved page ${railDragState.completedPage.pageNumber}`,
            text: railDragState.completedTargetPage
              ? `Reordered near page ${railDragState.completedTargetPage.pageNumber}.`
              : "The page order has been updated.",
          }
        : hasSelection
          ? {
              tone: "ready",
              title: `${selectedPages.length} page${selectedPages.length === 1 ? "" : "s"} selected`,
              text: "Shift-click to extend a range, or drag thumbnails to change page order.",
            }
          : {
              tone: "idle",
              title: "Rail navigation is ready",
              text: "Select pages, shift-click a range, or drag thumbnails to reorder the document.",
            };
    const viewerSelectionLabel = activePageSelected
      ? selectedPages.length > 1
        ? `In ${selectedPages.length}-page selection`
        : "Selected page"
      : "Active page only";
    const fillSignStatus = !hasFillAssets
      ? {
          tone: "empty",
          title: "Create your first Fill & Sign item",
          text: "Add a signature, text, date, or initials item, then place it on the active page.",
        }
      : selectedPlacedObjectOnActivePage
        ? {
            tone: "active",
            title: `${selectedPlacedObjectTypeLabel} selected on this page`,
            text: "Drag it to reposition, adjust its size, or remove it from the page.",
          }
        : activePageFillObjectCount
          ? {
              tone: "ready",
              title: `${activePageFillObjectCount} fill item${activePageFillObjectCount === 1 ? "" : "s"} on this page`,
              text: "Add another item or select one on the page to fine-tune it.",
            }
          : {
              tone: "ready",
              title: `${fillAssets.length} saved fill item${fillAssets.length === 1 ? "" : "s"} ready`,
              text: "Place a saved item on this page to continue completing the document.",
            };
    const viewerStatusItems = activePage
      ? [
          `Page ${activePage.pageNumber} / ${pages.length}`,
          activePage.rotation ? `Rotation: ${activePage.rotation}\u00B0` : null,
          zoomLevel !== 1 ? `Zoom: ${Math.round(zoomLevel * 100)}%` : null,
          activePageFillObjectCount
            ? `${activePageFillObjectCount} fill item${activePageFillObjectCount === 1 ? "" : "s"} on page`
            : null,
          activePageSelected ? "Selected" : null,
          activePage.markedForDeletion ? "Marked for Deletion" : null,
        ].filter(Boolean)
      : [];

    return {
      activePage,
      remainingCount,
      selectedIncludedCount,
      activePageSelected,
      activePageFillObjectCount,
      selectedPagesLabel,
      selectedIncludedLabel,
      batchStatus,
      fillSignStatus,
      hasFillAssets,
      hasLoadedEditor,
      activePagePosition,
      activeThumbnailPageNumber,
      railAssistant,
      selectedPlacedObjectOnActivePage,
      viewerSelectionLabel,
      viewerStatusItems,
    };
  }, [
    activeRailState,
    activePagePlacedObjects.length,
    deletedCount,
    pages.length,
    railDragState,
    selectedPlacedObject,
    selectedIncludedPages.length,
    selectedPages.length,
    fillAssets.length,
    zoomLevel,
  ]);
  const {
    activePage,
    remainingCount,
    selectedIncludedCount,
    activePageSelected,
    activePageFillObjectCount,
    selectedPagesLabel,
    selectedIncludedLabel,
    batchStatus,
    fillSignStatus,
    hasFillAssets,
    hasLoadedEditor,
    activePagePosition,
    activeThumbnailPageNumber,
    railAssistant,
    selectedPlacedObjectOnActivePage,
    viewerSelectionLabel,
    viewerStatusItems,
  } = editorDerivedState;

  useEffect(() => {
    const appCard = toolRootRef.current?.closest(".app-card-editor");
    if (!appCard) return undefined;

    appCard.classList.toggle("edit-pdf-active", Boolean(hasLoadedEditor));

    return () => {
      appCard.classList.remove("edit-pdf-active");
    };
  }, [hasLoadedEditor]);

  const thumbnailItems = useMemo(
    () =>
      pages.map((page, index) => (
        <SortableThumbnailPage
          key={page.id}
          page={page}
          index={index}
          totalPages={pages.length}
          isActive={activeThumbnailPageNumber === page.pageNumber}
          isSelected={selectedPageSet.has(page.pageNumber)}
          isDropTarget={
            railDragState.isDragging &&
            railDragState.overId === page.id &&
            railDragState.activeId !== page.id
          }
          isBatchDragActive={
            railDragState.isDragging &&
            railDragState.isBatchCandidate &&
            selectedPageSet.has(page.pageNumber)
          }
          isDropComplete={railDragState.completedId === page.id}
          onActivate={handleThumbnailActivate}
          onToggleSelection={togglePageSelection}
        />
      )),
    [
      activeThumbnailPageNumber,
      handleThumbnailActivate,
      pages,
      railDragState.activeId,
      railDragState.completedId,
      railDragState.isBatchCandidate,
      railDragState.isDragging,
      railDragState.overId,
      selectedPageSet,
      togglePageSelection,
    ],
  );

  return (
    <div
      ref={toolRootRef}
      className={`edit-pdf-tool ${hasLoadedEditor ? "loaded" : "empty"}`}
    >
      <div className="tool-header">
        <div>
          <h2>Edit PDF</h2>
          <p className="tool-sub">
            Reorder, rotate, delete, and extract PDF pages in one browser-based editor.
          </p>
        </div>

        {!isPremium && <div className="free-badge">Free</div>}
      </div>

      <UpgradeBanner
        title={`Free plan: ${FILE_SIZE_LIMIT_LABEL} max file`}
        subtitle="ProjectStack Pro is designed for bigger PDFs and more capable all-in-one editing workflows over time."
        features={[
          "Edit larger PDFs without hitting the free cap",
          "Keep page cleanup and organization work in one place",
          "Make future premium editing upgrades easier to unlock",
        ]}
        ctaText="See Pro benefits"
        upgradeReason={EDIT_FEATURE.upgradeReason}
      />

      <div className={`edit-pdf-flow ${hasLoadedEditor ? "loaded" : "empty"}`}>
        <div className="edit-pdf-setup-panel">
          <div
            className={`drop-zone edit-pdf-drop-zone ${isDragOver ? "drag-over" : ""} ${isProcessing ? "disabled" : ""}`}
            role="button"
            tabIndex={isProcessing ? -1 : 0}
            aria-label={`Upload a PDF for Edit PDF. Free plan includes one PDF up to ${FILE_SIZE_LIMIT_LABEL}.`}
            aria-disabled={isProcessing}
            onDragOver={handleUploadDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => {
              if (!isProcessing) fileInputRef.current?.click();
            }}
            onKeyDown={(event) => {
              if (isProcessing) return;
              activateOnEnterOrSpace(event, () => fileInputRef.current?.click());
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              hidden
            />

            <div className="drop-zone-title">Select or Drop PDF Here</div>
            <div className="drop-zone-sub">
              Free plan includes one PDF up to {FILE_SIZE_LIMIT_LABEL}
            </div>
          </div>

          {file && (
            <div className="file-selection-card edit-pdf-file-card">
              <div className="file-meta">
                <p className="file-name">{file.name}</p>
                <p className="file-size">{formatBytes(file.size)}</p>
              </div>

              <button type="button" className="remove-btn" onClick={clearSelectedFile}>
                Remove
              </button>
            </div>
          )}

          {file && (
            <div className="usage-indicator">
              {MAX_FILES} / {MAX_FILES} PDF selected
            </div>
          )}

          <div className="usage-indicator trust-indicator">
            {EDIT_FEATURE.privacyMessage}
          </div>

          {isProcessing && (
            <div className="usage-indicator processing-indicator">
              {EDIT_FEATURE.processingMessage}
            </div>
          )}

          {message && (
            <div className={`inline-message ${message.type}`}>{message.text}</div>
          )}

          <AdSlot placement={EDIT_FEATURE.adPlacement} isVisible={showExportAd} />

          {file && !pages.length && !isProcessing && (
            <button className="merge-btn" onClick={loadPdfPages}>
              Load PDF Pages
            </button>
          )}
        </div>

        {pages.length > 0 && activePage && (
        <DndContext
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragCancel={handleDragCancel}
          onDragEnd={handleDragEnd}
        >
          <div className="edit-pdf-shell edit-pdf-editor-panel">
            <div className="edit-pdf-doc-summary" aria-label="Loaded document summary">
              <div className="edit-pdf-doc-summary-copy">
                <strong>{file.name}</strong>
                <span>{pages.length} page{pages.length === 1 ? "" : "s"} loaded</span>
              </div>
            </div>

              <div className="edit-pdf-toolbar">
                <div className="edit-pdf-toolbar-overview">
                  <div className="edit-pdf-toolbar-section edit-pdf-toolbar-status">
                    <strong>{remainingCount} pages in export</strong>
                    <span>{deletedCount} removed from export</span>
                  </div>

                  <div className="edit-pdf-toolbar-metrics" aria-label="Toolbar document metrics">
                    <span className="edit-pdf-toolbar-metric">
                      <strong>{pages.length}</strong>
                      total
                    </span>
                    <span className="edit-pdf-toolbar-metric">
                      <strong>{remainingCount}</strong>
                      in export
                    </span>
                    <span className="edit-pdf-toolbar-metric">
                      <strong>{deletedCount}</strong>
                      removed
                    </span>
                  </div>
                </div>

                <div className="edit-pdf-toolbar-command-bar" aria-label="Edit PDF commands">
                  <section className="edit-pdf-batch-panel" aria-label="Selected page actions">
                    <div className="edit-pdf-batch-panel-head">
                      <div className="edit-pdf-batch-panel-copy">
                        <span className="edit-pdf-toolbar-label">Selected Pages</span>
                        <span className="edit-pdf-batch-panel-sub">
                          Bulk actions for the current selection
                        </span>
                      </div>

                      <div
                        className="edit-pdf-batch-panel-metrics"
                        aria-label="Selected page workflow summary"
                      >
                        <span className="edit-pdf-batch-panel-metric">
                          {selectedPagesLabel}
                        </span>
                        <span className="edit-pdf-batch-panel-metric">
                          {selectedIncludedLabel}
                        </span>
                      </div>
                    </div>

                    <div
                      className={`edit-pdf-batch-panel-status ${batchStatus.tone}`}
                      aria-live="polite"
                    >
                      <strong>{batchStatus.title}</strong>
                      <span>{batchStatus.text}</span>
                    </div>

                    <div className="edit-pdf-toolbar-groups">
                      <section className="edit-pdf-toolbar-group" aria-label="Selection commands">
                        <div className="edit-pdf-toolbar-group-head">
                          <span className="edit-pdf-toolbar-label">Selection</span>
                          <span className="edit-pdf-toolbar-group-context">
                            Manage selected-page scope
                          </span>
                        </div>
                        <div className="edit-pdf-toolbar-section">
                          <button
                            type="button"
                            className="hero-secondary-btn"
                            onClick={selectAllPages}
                          >
                            Select All
                          </button>
                          <button
                            type="button"
                            className="hero-secondary-btn"
                            onClick={clearPageSelection}
                          >
                            Clear Selection
                          </button>
                        </div>
                      </section>

                      <section className="edit-pdf-toolbar-group" aria-label="Rotation commands">
                        <div className="edit-pdf-toolbar-group-head">
                          <span className="edit-pdf-toolbar-label">Rotate</span>
                          <span className="edit-pdf-toolbar-group-context">
                            Applies to selected pages
                          </span>
                        </div>
                        <div className="edit-pdf-toolbar-section">
                          <button
                            type="button"
                            className="hero-secondary-btn"
                            onClick={() => rotateSelectedPages(-90)}
                            disabled={!selectedPages.length}
                          >
                            Rotate Left
                          </button>
                          <button
                            type="button"
                            className="hero-secondary-btn"
                            onClick={() => rotateSelectedPages(90)}
                            disabled={!selectedPages.length}
                          >
                            Rotate Right
                          </button>
                        </div>
                      </section>

                      <section className="edit-pdf-toolbar-group" aria-label="Page action commands">
                        <div className="edit-pdf-toolbar-group-head">
                          <span className="edit-pdf-toolbar-label">Page Actions</span>
                          <span className="edit-pdf-toolbar-group-context">
                            Batch-ready page operations
                          </span>
                        </div>
                        <div className="edit-pdf-toolbar-section">
                          <button
                            type="button"
                            className="hero-secondary-btn"
                            onClick={markSelectedForDeletion}
                            disabled={!selectedPages.length}
                          >
                            Delete Selected
                          </button>
                          <button
                            type="button"
                            className="hero-secondary-btn"
                            onClick={keepSelectedPages}
                            disabled={!selectedPages.length}
                          >
                            Keep Selected
                          </button>
                          <button
                            type="button"
                            className="hero-secondary-btn"
                            disabled={!selectedIncludedCount || isProcessing}
                            onClick={exportSelectedPages}
                          >
                            Extract Selected
                          </button>
                        </div>
                      </section>
                    </div>
                  </section>

                  <section
                    className="edit-pdf-toolbar-group edit-pdf-toolbar-group-export"
                    aria-label="Export commands"
                  >
                    <div className="edit-pdf-toolbar-group-head">
                      <span className="edit-pdf-toolbar-label">Export</span>
                      <span className="edit-pdf-toolbar-group-context">
                        Whole document
                      </span>
                    </div>
                    <div className="edit-pdf-toolbar-section edit-pdf-toolbar-section-right">
                      <button
                        type="button"
                        className="hero-primary-btn edit-pdf-export-btn"
                        disabled={!pages.length || !remainingCount || isProcessing}
                        onClick={exportEditedDocument}
                      >
                        {isProcessing ? "Exporting..." : "Export Document"}
                      </button>
                    </div>
                  </section>
                </div>
              </div>

            <div className="edit-pdf-workspace">
              <aside className="edit-pdf-sidebar">
                <div className="edit-pdf-sidebar-head">
                  <div className="edit-pdf-sidebar-head-copy">
                    <strong>Pages</strong>
                    <span>Drag to reorder</span>
                  </div>

                  <div className="edit-pdf-sidebar-head-metrics" aria-label="Thumbnail rail overview">
                    <span className="edit-pdf-sidebar-metric">
                      <strong>{pages.length}</strong>
                      pages
                    </span>
                    <span className="edit-pdf-sidebar-metric">
                      <strong>{selectedPages.length}</strong>
                      selected
                    </span>
                  </div>
                </div>

                <div className="edit-pdf-sidebar-command-bar" aria-label="Thumbnail rail commands">
                  <button
                    type="button"
                    className="hero-secondary-btn"
                    onClick={selectAllPages}
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    className="hero-secondary-btn"
                    onClick={clearPageSelection}
                  >
                    Clear
                  </button>
                </div>

                <div
                  className={`edit-pdf-sidebar-feedback ${railAssistant.tone}`}
                  aria-live="polite"
                >
                  <strong>{railAssistant.title}</strong>
                  <span>{railAssistant.text}</span>
                </div>

                <SortableContext
                  items={pageIds}
                  strategy={verticalListSortingStrategy}
                >
                  <div
                    ref={thumbnailListRef}
                    className="edit-pdf-thumbnail-list"
                    data-selected-count={selectedRailSelection.count}
                    data-drag-active={railDragState.isDragging}
                    data-drag-batch-ready={railDragState.isBatchCandidate}
                    data-drag-selection-count={railDragState.selectedCount}
                    data-drop-complete={Boolean(railDragState.completedPage)}
                  >
                    {thumbnailItems}
                  </div>
                </SortableContext>
              </aside>

              <section className="edit-pdf-viewer">
                <input
                  ref={signatureUploadInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleSignatureUpload}
                />

                <div className="edit-pdf-viewer-head">
                  <div>
                    <p className="section-eyebrow">Document Viewer</p>
                    <h3>Page {activePage.pageNumber}</h3>
                    <p>
                      {activePage.markedForDeletion
                        ? "This page is currently removed from the edited PDF."
                        : `Position ${activePagePosition} of ${pages.length}`}
                    </p>
                  </div>

                  <div className="edit-pdf-viewer-chip-row">
                    <span
                      className={`edit-pdf-viewer-chip ${
                        activePageSelected ? "selected" : "neutral"
                      }`}
                    >
                      {viewerSelectionLabel}
                    </span>
                    <span
                      className={`edit-pdf-viewer-chip ${
                        activePage.markedForDeletion ? "warning" : "ready"
                      }`}
                    >
                      {activePage.markedForDeletion ? "Removed from export" : "Included in export"}
                    </span>
                    <span className="edit-pdf-viewer-chip">
                      {`Rotation ${activePage.rotation}\u00B0`}
                    </span>
                  </div>
                </div>

                  <div className="edit-pdf-viewer-body">
                    <div
                      className={`edit-pdf-viewer-workspace ${
                        isPageSwitching ? "page-switching" : ""
                      } ${activePageSelected ? "selection-active" : ""} ${
                        activePage.markedForDeletion ? "page-removed" : ""
                      }`}
                    >
                      <div className="edit-pdf-viewer-page-header" aria-label="Active page context">
                        <div className="edit-pdf-viewer-page-header-copy">
                          <span className="edit-pdf-viewer-page-kicker">Active page</span>
                          <strong>
                            Page {activePage.pageNumber} of {pages.length}
                          </strong>
                        </div>
                        <span className="edit-pdf-viewer-page-state">
                          {activePage.markedForDeletion
                            ? "Marked for deletion"
                            : activePageSelected
                              ? "Selected"
                              : "Ready to edit"}
                        </span>
                      </div>
                      <div className="edit-pdf-viewer-stage">
                        <div className="edit-pdf-viewer-canvas-shell">
                          <div className="edit-pdf-viewer-surface">
                            <div className="edit-pdf-viewer-preview-frame">
                              <div className="edit-pdf-viewer-document-shell">
                                <div
                                  className="edit-pdf-viewer-overlay-surface"
                                  aria-hidden="true"
                                />
                                <div className="edit-pdf-viewer-canvas">
                                  <div className="edit-pdf-viewer-page-shell">
                                    <div
                                      ref={pageStageRef}
                                      className="edit-pdf-viewer-page-stage"
                                      onClick={clearSelectedPlacedObject}
                                    >
                                      <div
                                        className="edit-pdf-viewer-page-transform"
                                        style={{
                                          transform: `rotate(${activePage.rotation}deg) scale(${zoomLevel})`,
                                        }}
                                      >
                                        <img
                                          className="edit-pdf-viewer-image"
                                          src={activePage.previewUrl}
                                          alt={`Preview of PDF page ${activePage.pageNumber}`}
                                        />
                                        <div className="edit-pdf-signature-layer">
                                          {activePagePlacedObjects.map((placedObject) => {
                                            const fillAsset = fillAssetMap.get(
                                              placedObject.assetId,
                                            );
                                            if (!fillAsset) return null;

                                            return (
                                              <button
                                                key={placedObject.id}
                                                type="button"
                                                className={`edit-pdf-signature-object ${
                                                  selectedPlacedObjectOnActivePage?.id === placedObject.id
                                                    ? "selected"
                                                    : ""
                                                } ${
                                                  draggingPlacedObjectId === placedObject.id
                                                    ? "dragging"
                                                    : ""
                                                } edit-pdf-fill-object-${placedObject.type}`}
                                                style={{
                                                  left: `${placedObject.xRatio * 100}%`,
                                                  top: `${placedObject.yRatio * 100}%`,
                                                  width: `${placedObject.widthRatio * 100}%`,
                                                }}
                                                aria-label={`Placed ${placedObject.type} ${fillAsset.label}`}
                                                onClick={(event) => {
                                                  event.stopPropagation();
                                                  dispatchEditorState({
                                                    type: "set_selected_placed_object",
                                                    objectId: placedObject.id,
                                                  });
                                                }}
                                                onPointerDown={(event) =>
                                                  handlePlacedObjectPointerDown(event, placedObject)
                                                }
                                              >
                                                <img
                                                  src={fillAsset.dataUrl}
                                                  alt={`${fillAsset.label} ${placedObject.type}`}
                                                />
                                              </button>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                <div className="edit-pdf-viewer-actions">
                  <div className="edit-pdf-viewer-action-group">
                    <button
                      type="button"
                      className="hero-secondary-btn"
                      onClick={() => togglePageSelection(activePage.pageNumber)}
                    >
                      {activePageSelected ? "Unselect Page" : "Select Page"}
                    </button>
                  </div>

                  <div className="edit-pdf-viewer-action-group">
                    <button
                      type="button"
                      className="hero-secondary-btn"
                      onClick={() => rotateActivePage(-90)}
                    >
                      Rotate Left
                    </button>
                    <button
                      type="button"
                      className="hero-secondary-btn"
                      onClick={() => rotateActivePage(90)}
                    >
                      Rotate Right
                    </button>
                  </div>

                  <div className="edit-pdf-viewer-action-group edit-pdf-viewer-action-group-zoom">
                    <span className="edit-pdf-viewer-action-label">
                      Zoom {Math.round(zoomLevel * 100)}%
                    </span>
                    <button
                      type="button"
                      className="hero-secondary-btn"
                      onClick={() => adjustZoom(-ZOOM_STEP)}
                      disabled={zoomLevel <= MIN_ZOOM}
                    >
                      Zoom Out
                    </button>
                    <button
                      type="button"
                      className="hero-secondary-btn"
                      onClick={() => adjustZoom(ZOOM_STEP)}
                      disabled={zoomLevel >= MAX_ZOOM}
                    >
                      Zoom In
                    </button>
                    <button
                      type="button"
                      className="hero-secondary-btn"
                      onClick={resetZoom}
                      disabled={zoomLevel === 1}
                    >
                      Reset Zoom
                    </button>
                  </div>

                  <div className="edit-pdf-viewer-action-group">
                    <button
                      type="button"
                      className="hero-secondary-btn"
                      onClick={toggleActivePageDeletion}
                    >
                      {activePage.markedForDeletion ? "Keep Page" : "Delete Page"}
                    </button>
                  </div>
                </div>

                <section className="edit-pdf-fill-sign-panel" aria-label="Fill and sign">
                  <div className="edit-pdf-fill-sign-head">
                    <div className="edit-pdf-fill-sign-copy">
                      <span className="edit-pdf-toolbar-label">Fill &amp; Sign</span>
                      <strong>Page completion workflow</strong>
                      <span>
                        Create signatures, text, date, and initials items, then place them on the active page and flatten them on export.
                      </span>
                    </div>

                    <div className="edit-pdf-fill-sign-metrics">
                      <span className="edit-pdf-fill-sign-metric">
                        <strong>{fillAssets.length}</strong>
                        saved
                      </span>
                      <span className="edit-pdf-fill-sign-metric">
                        <strong>{activePageFillObjectCount}</strong>
                        on page
                      </span>
                    </div>
                  </div>

                  <div className={`edit-pdf-fill-sign-status ${fillSignStatus.tone}`}>
                    <strong>{fillSignStatus.title}</strong>
                    <span>{fillSignStatus.text}</span>
                  </div>

                  <div className="edit-pdf-fill-sign-grid">
                    <div className="edit-pdf-fill-sign-block">
                      <div className="edit-pdf-fill-sign-block-head">
                        <strong>Create signature</strong>
                        <span>Type or upload one signature at a time.</span>
                      </div>

                      <div className="edit-pdf-fill-sign-type-row">
                        <input
                          type="text"
                          className="edit-pdf-fill-sign-input"
                          value={typedSignatureValue}
                          placeholder="Type your signature"
                          onChange={(event) => setTypedSignatureValue(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              handleCreateTypedSignature();
                            }
                          }}
                        />
                        <button
                          type="button"
                          className="hero-secondary-btn"
                          onClick={handleCreateTypedSignature}
                          disabled={!typedSignatureValue.trim() || isPreparingFillAsset}
                        >
                          {isPreparingFillAsset ? "Creating..." : "Create"}
                        </button>
                      </div>

                      <div className="edit-pdf-fill-sign-upload-row">
                        <button
                          type="button"
                          className="hero-secondary-btn"
                          onClick={() => signatureUploadInputRef.current?.click()}
                          disabled={isPreparingFillAsset}
                        >
                          Upload Signature Image
                        </button>
                        <span>PNG, JPG, or other image formats are converted locally.</span>
                      </div>
                    </div>

                    <div className="edit-pdf-fill-sign-block">
                      <div className="edit-pdf-fill-sign-block-head">
                        <strong>Quick fill items</strong>
                        <span>Create and place text, date, or initials on page {activePage.pageNumber}.</span>
                      </div>

                      <div className="edit-pdf-fill-sign-type-row">
                        <input
                          type="text"
                          className="edit-pdf-fill-sign-input"
                          value={fillTextValue}
                          placeholder="Add text"
                          onChange={(event) => setFillTextValue(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              handleCreateTextObject();
                            }
                          }}
                        />
                        <button
                          type="button"
                          className="hero-secondary-btn"
                          onClick={handleCreateTextObject}
                          disabled={!fillTextValue.trim() || isPreparingFillAsset}
                        >
                          Add Text
                        </button>
                      </div>

                      <div className="edit-pdf-fill-sign-type-row">
                        <input
                          type="text"
                          className="edit-pdf-fill-sign-input"
                          value={dateValue}
                          placeholder="Add date"
                          onChange={(event) => setDateValue(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              handleCreateDateObject();
                            }
                          }}
                        />
                        <button
                          type="button"
                          className="hero-secondary-btn"
                          onClick={() => setDateValue(getCurrentDateLabel())}
                        >
                          Today
                        </button>
                        <button
                          type="button"
                          className="hero-secondary-btn"
                          onClick={handleCreateDateObject}
                          disabled={!dateValue.trim() || isPreparingFillAsset}
                        >
                          Add Date
                        </button>
                      </div>

                      <div className="edit-pdf-fill-sign-type-row">
                        <input
                          type="text"
                          className="edit-pdf-fill-sign-input"
                          value={initialsValue}
                          maxLength={6}
                          placeholder="Add initials"
                          onChange={(event) => setInitialsValue(event.target.value.toUpperCase())}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              handleCreateInitialsObject();
                            }
                          }}
                        />
                        <button
                          type="button"
                          className="hero-secondary-btn"
                          onClick={handleCreateInitialsObject}
                          disabled={!initialsValue.trim() || isPreparingFillAsset}
                        >
                          Add Initials
                        </button>
                      </div>
                    </div>

                    <div className="edit-pdf-fill-sign-block">
                      <div className="edit-pdf-fill-sign-block-head">
                        <strong>Saved fill items</strong>
                        <span>Place any saved item on page {activePage.pageNumber}.</span>
                      </div>

                      {hasFillAssets ? (
                        <div className="edit-pdf-fill-sign-library">
                          {fillAssets.map((asset) => (
                            <article key={asset.id} className="edit-pdf-signature-card">
                              <div className="edit-pdf-signature-card-preview">
                                <img
                                  className={`edit-pdf-fill-sign-preview-image edit-pdf-fill-sign-preview-image-${asset.type}`}
                                  src={asset.dataUrl}
                                  alt={`${asset.label} ${asset.type} preview`}
                                />
                              </div>
                              <div className="edit-pdf-signature-card-copy">
                                <strong>{asset.label}</strong>
                                <span>{getFillAssetSourceLabel(asset.type, asset.source)}</span>
                              </div>
                              <button
                                type="button"
                                className="hero-secondary-btn"
                                onClick={() => placeFillAssetOnActivePage(asset.id)}
                              >
                                Place on Page
                              </button>
                            </article>
                          ))}
                        </div>
                      ) : (
                        <div className="edit-pdf-fill-sign-empty">
                          Create a signature, text, date, or initials item to start placing Fill &amp; Sign objects.
                        </div>
                      )}
                    </div>

                    <div className="edit-pdf-fill-sign-block">
                      <div className="edit-pdf-fill-sign-block-head">
                        <strong>Selected item</strong>
                        <span>
                          {selectedPlacedObjectOnActivePage
                            ? "Adjust the active item without leaving the viewer."
                            : "Select a placed item on the page to resize or remove it."}
                        </span>
                      </div>

                      {selectedPlacedObjectOnActivePage && selectedPlacedObjectAsset ? (
                        <div className="edit-pdf-fill-sign-active-card">
                          <div className="edit-pdf-fill-sign-active-preview">
                            <img
                              className={`edit-pdf-fill-sign-preview-image edit-pdf-fill-sign-preview-image-${selectedPlacedObjectOnActivePage.type}`}
                              src={selectedPlacedObjectAsset.dataUrl}
                              alt={`${selectedPlacedObjectAsset.label} selected ${selectedPlacedObjectOnActivePage.type}`}
                            />
                          </div>
                          <div className="edit-pdf-fill-sign-active-copy">
                            <strong>{selectedPlacedObjectAsset.label}</strong>
                            <span>
                              {getFillAssetSourceLabel(
                                selectedPlacedObjectOnActivePage.type,
                                selectedPlacedObjectAsset.source,
                              )} selected. Drag on the page to reposition it.
                            </span>
                          </div>
                          <label className="edit-pdf-fill-sign-scale-control">
                            <span>
                              Size {Math.round(selectedPlacedObjectOnActivePage.widthRatio * 100)}%
                            </span>
                            <input
                              type="range"
                              min={MIN_PLACED_OBJECT_WIDTH_RATIO}
                              max={MAX_PLACED_OBJECT_WIDTH_RATIO}
                              step="0.01"
                              value={selectedPlacedObjectOnActivePage.widthRatio}
                              onChange={(event) =>
                                updateSelectedPlacedObjectWidth(Number(event.target.value))
                              }
                            />
                          </label>
                          <button
                            type="button"
                            className="hero-secondary-btn"
                            onClick={removeSelectedPlacedObject}
                          >
                            Remove Item
                          </button>
                        </div>
                      ) : (
                        <div className="edit-pdf-fill-sign-empty">
                          No placed Fill &amp; Sign item is selected on this page yet.
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                {viewerStatusItems.length > 0 && (
                  <div className="edit-pdf-viewer-status" aria-label="Active page status">
                    {viewerStatusItems.map((item) => (
                      <span key={item} className="edit-pdf-viewer-status-item">
                        {item}
                      </span>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        </DndContext>
        )}
      </div>
    </div>
  );
}
