import React from "react";

const page = () => {
  return (
    <main className="root-container flex min-h-screen flex-col items-center justify-center">
      <h1 className="font-bebas-neue text-5xl font-bold text-light-100">
        429 Too Many Requests
      </h1>
      <p className="mt-3 max-w-xl text-center text-light-400">
        It seems like you have been a litte too eager. We have put a temporary
        pasue on your excitement. Chill for a bit, and try again shortly.
      </p>
    </main>
  );
};

export default page;
