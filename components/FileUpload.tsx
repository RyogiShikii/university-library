"use client";

import {
  ImageKitAbortError,
  ImageKitInvalidRequestError,
  ImageKitServerError,
  ImageKitUploadNetworkError,
  upload,
} from "@imagekit/next";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Input } from "./ui/input";
import { Button } from "./ui/button";
import config from "@/lib/config";

interface Props {
  type: "image" | "video";
  folder: string;
  checks?: string;
  value?: string;
  onFieldChange: (value: string | undefined) => void;
}

const FileUpload = ({ type, folder, checks, value, onFieldChange }: Props) => {
  // State to keep track of the current upload progress (percentage)
  const [progress, setProgress] = useState(0);

  // Create a ref for the file input element to access its files easily
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Create an AbortController instance to provide an option to cancel the upload if needed.
  const abortController = new AbortController();

  /**
   * Authenticates and retrieves the necessary upload credentials from the server.
   *
   * This function calls the authentication API endpoint to receive upload parameters like signature,
   * expire time, token, and publicKey.
   *
   * returns {Promise<{signature: string, expire: string, token: string, publicKey: string}>} The authentication parameters.
   * throws {Error} Throws an error if the authentication request fails.
   */
  //need to be controlled by form

  const authenticator = async () => {
    try {
      // Perform the request to the upload authentication endpoint.
      const response = await fetch(`${config.env.apiEndpoint}/api/upload-auth`);
      if (!response.ok) {
        // If the server response is not successful, extract the error text for debugging.
        const errorText = await response.text();
        throw new Error(
          `Request failed with status ${response.status}: ${errorText}`
        );
      }

      // Parse and destructure the response JSON for upload credentials.
      const data = await response.json();
      const { signature, expire, token, publicKey } = data;
      return { signature, expire, token, publicKey };
    } catch (error) {
      // Log the original error for debugging before rethrowing a new error.
      console.error("Authentication error:", error);
      throw new Error("Authentication request failed");
    }
  };

  /**
   * Handles the file upload process.
   *
   * This function:
   * - Validates file selection.
   * - Retrieves upload authentication credentials.
   * - Initiates the file upload via the ImageKit SDK.
   * - Updates the upload progress.
   * - Catches and processes errors accordingly.
   */
  const handleUpload = async () => {
    // Access the file input element using the ref
    const fileInput = fileInputRef.current;
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      alert("Please select a file to upload");
      return;
    }

    // Extract the first file from the file input
    const file = fileInput.files[0];

    const imageTypes = ["image/jpeg", "image/png", "image/webp"];
    const videoTypes = ["video/mp4", "video/quicktime"];
    const maxImageSize = 5 * 1024 * 1024; // 5MB
    const maxVideoSize = 50 * 1024 * 1024; // 50MB

    const isImage = type === "image";
    const isVideo = type === "video";

    if (isImage && !imageTypes.includes(file.type)) {
      alert("Only support type for jpeg, png and webp");
      return;
    }

    if (isVideo && !videoTypes.includes(file.type)) {
      alert("Only support mp4 and quicktime");
      return;
    }

    if (isImage && file.size > maxImageSize) {
      alert("cannot upload image over 5MB");
      return;
    }

    if (isVideo && file.size > maxVideoSize) {
      alert("Cannot upload video over 50MB");
      return;
    }

    // Retrieve authentication parameters for the upload.
    let authParams;
    try {
      authParams = await authenticator();
    } catch (authError) {
      toast.error("Failed to authenticate for upload", {
        position: "top-center",
      });
      return;
    }
    const { signature, expire, token, publicKey } = authParams;

    // Call the ImageKit SDK upload function with the required parameters and callbacks.
    try {
      const uploadResponse = await upload({
        // Authentication parameters
        expire,
        token,
        signature,
        publicKey,
        file,
        fileName: file.name, // Optionally set a custom file name
        // Progress callback to update upload progress state
        onProgress: (event) => {
          setProgress((event.loaded / event.total) * 100);
        },
        // Abort signal to allow cancellation of the upload if needed.
        abortSignal: abortController.signal,
        folder: folder,
        checks: checks,
      });

      toast.success("Your file has been uploaded.", {
        position: "top-center",
      });
      onFieldChange(uploadResponse.url);
    } catch (error) {
      // Handle specific error types provided by the ImageKit SDK.
      if (error instanceof ImageKitAbortError) {
        toast.error("Upload aborted", {
          position: "top-center",
        });
        console.error("Upload aborted:", error.reason);
      } else if (error instanceof ImageKitInvalidRequestError) {
        toast.error("Invalid request", {
          position: "top-center",
        });
        console.error("Invalid request:", error.message);
      } else if (error instanceof ImageKitUploadNetworkError) {
        toast.error("Network error", {
          position: "top-center",
        });
        console.error("Network error:", error.message);
      } else if (error instanceof ImageKitServerError) {
        toast.error("Server error", {
          position: "top-center",
        });
        console.error("Server error:", error.message);
      } else {
        // Handle any other errors that may occur.
        toast.error("Upload error", {
          position: "top-center",
        });
        console.error("Upload error:", error);
      }
    }
  };

  return (
    <>
      {/* File input element using React ref */}
      <Input
        type="file"
        ref={fileInputRef}
        className="cursor-pointer"
        accept={type === "image" ? "image/*" : "video/*"}
      />
      {/* Button to trigger the upload process */}

      {/* Display the current upload progress */}
      <progress value={progress} max={100} className="w-full"></progress>
      <Button
        onClick={(e) => {
          e.preventDefault();
          handleUpload();
        }}
        className="cursor-pointer"
      >
        Upload file
      </Button>
    </>
  );
};

export default FileUpload;
