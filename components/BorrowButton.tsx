"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { borrowBook } from "@/lib/actions/borrowBook";

interface Props {
  bookId: string;
  userId: string;
  borrowingEligibility: {
    isEligible: boolean;
    message: string;
  };
}

const BorrowButton = ({
  bookId,
  userId,
  borrowingEligibility: { isEligible, message },
}: Props) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleBorrowBook = async () => {
    //check if book is available for borrowing
    if (!isEligible) {
      toast.error("Error", {
        description: message,
        position: "top-center",
      });

      return;
    }

    //set isLoading
    setIsLoading(true);

    try {
      const result = await borrowBook({ userId, bookId });

      if (result.success) {
        toast.success("Success", {
          description: "Book borrowed successfully.",
        });

        router.push("/my-profile");
      } else {
        toast.error("Error", {
          description: result.error,
          position: "top-center",
        });
      }
    } catch (error) {
      toast.error("Error", {
        description: "An error occurred while borrowing the book.",
        position: "top-center",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      className="book-overview_btn"
      onClick={handleBorrowBook}
      disabled={isLoading}
    >
      <Image src="/icons/book.svg" alt="book" width={20} height={20} />
      <p className="font-bebas-neue text-xl text-dark-100">
        {isLoading ? "Borrowing..." : "Borrow Book"}
      </p>
    </Button>
  );
};

export default BorrowButton;
