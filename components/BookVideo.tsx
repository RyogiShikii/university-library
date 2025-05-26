import React from "react";
import { Video } from "@imagekit/next";
import config from "@/lib/config";

const BookVideo = ({ videoUrl }: { videoUrl: string }) => {
  return (
    <Video
      urlEndpoint={config.env.imagekit.urlEndpoint}
      src={videoUrl}
      controls
      className="w-full rounded-xl"
    />
  );
};

export default BookVideo;
