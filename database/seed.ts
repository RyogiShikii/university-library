import dummyBooks from "../dummybooks.json";
import ImageKit from "imagekit";
import { books } from "./schema";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle({ client: sql });

const imagekit = new ImageKit({
  publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!,
});

const uploadToImageKit = async (
  url: string,
  fileName: string,
  folder: string
) => {
  try {
    const uploadResponse = await imagekit.upload({
      file: url,
      fileName: fileName,
      folder: folder,
    });

    return uploadResponse.url;
  } catch (error) {
    console.error("Error to upload to ImageKit:", error);
  }
};

const seed = async () => {
  console.log("seeding data...");

  try {
    for (const book of dummyBooks) {
      //upload image
      const coverUrl = (await uploadToImageKit(
        book.coverUrl,
        book.title,
        "/images/cover"
      )) as string;
      console.log("image uploaded");

      //upload video
      const videoUrl = (await uploadToImageKit(
        book.videoUrl,
        book.title,
        "/videos/trailer"
      )) as string;
      console.log("video uploaded");

      //upload book to database
      await db.insert(books).values({
        ...book,
        coverUrl,
        videoUrl,
      });
      console.log("book uploaded.");
    }
  } catch (error) {
    console.log("Error seeding data:", error);
  }
};

seed();
