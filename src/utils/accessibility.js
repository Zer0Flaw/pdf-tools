export function activateOnEnterOrSpace(event, onActivate) {
  if (event.key !== "Enter" && event.key !== " ") {
    return;
  }

  event.preventDefault();
  onActivate();
}
