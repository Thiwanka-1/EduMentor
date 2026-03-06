export default function VideoAvatar({ videoUrl }) {
  if (!videoUrl) {
    return (
      <div className="text-gray-400 text-center mt-10">
        Avatar will appear here…
      </div>
    );
  }

  return (
    <video
      src={videoUrl}
      autoPlay
      controls
      className="rounded-lg shadow-xl w-full"
    />
  );
}
