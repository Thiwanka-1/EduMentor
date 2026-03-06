export async function uploadSlides(file) {
  const formData = new FormData();
  formData.append("slides", file);

  const res = await fetch("http://localhost:8080/api/slides/upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) throw new Error("Upload failed");

  return await res.json(); // { slideId, pages }
}
