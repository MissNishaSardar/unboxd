"use client";

const error = ({ reset }: { reset: () => void }) => {
  return (
    <div>
      <h1>Something went wrong</h1>
      <button
        type="button"
        onClick={reset}>
        Try again
      </button>
    </div>
  );
};

export default error;
