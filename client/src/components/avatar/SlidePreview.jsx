export default function SlidePreview({ pages, currentPage }) {
  if (!pages || pages.length === 0) return null;

  return (
    <div className="w-full h-[350px] bg-black rounded overflow-hidden flex items-center justify-center mb-4">
      <img
        src={pages[currentPage]}
        alt="slide"
        className="max-h-full max-w-full"
      />
    </div>
  );
}
