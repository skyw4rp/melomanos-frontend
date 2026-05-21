export function formatReviewSubmitError(err: unknown): string {
  if (!(err instanceof Error)) {
    return "No se pudo enviar la review.";
  }

  const msg = err.message.toLowerCase();
  if (
    msg.includes("already exists") ||
    msg.includes("ya calificaste") ||
    msg.includes("duplicate")
  ) {
    return "Ya calificaste esta compra.";
  }

  if (err.message.length > 0 && err.message.length < 200) {
    return err.message;
  }

  return "No se pudo enviar la review.";
}
