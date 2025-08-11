import React from "react";

interface NewTabPageProps {
  onNavigate: (url: string) => void;
}

const NewTabPage: React.FC<NewTabPageProps> = ({ onNavigate }) => {
  const handleSearchSubmit = (value: string) => {
    if (value.trim()) {
      const url =
        value.includes(".") && !value.includes(" ")
          ? value.startsWith("http")
            ? value
            : `https://${value}`
          : `https://www.google.com/search?q=${encodeURIComponent(value)}`;
      onNavigate(url);
    }
  };

  return <div className="flex h-full w-full items-center justify-center bg-white">TODO</div>;

  return (
    <div className="flex h-full items-center justify-center text-neutral-600">
      <div className="text-center">
        <div className="mb-6 text-2xl font-light">New Tab</div>
        <div className="mb-8">
          <input
            type="text"
            placeholder="Search or enter web address"
            className="w-96 rounded-lg border border-neutral-300/30 px-4 py-3 text-center focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearchSubmit(e.currentTarget.value);
              }
            }}
          />
        </div>
        <div className="grid grid-cols-4 gap-4 text-sm">
          <button
            onClick={() => onNavigate("https://www.google.com")}
            className="rounded-lg bg-neutral-100 p-4 transition-colors hover:bg-neutral-200"
          >
            <div className="mb-2 text-lg">🔍</div>
            <div>Google</div>
          </button>
          <button
            onClick={() => onNavigate("https://www.youtube.com")}
            className="rounded-lg bg-neutral-100 p-4 transition-colors hover:bg-neutral-200"
          >
            <div className="mb-2 text-lg">📺</div>
            <div>YouTube</div>
          </button>
          <button
            onClick={() => onNavigate("https://www.github.com")}
            className="rounded-lg bg-neutral-100 p-4 transition-colors hover:bg-neutral-200"
          >
            <div className="mb-2 text-lg">⚡</div>
            <div>GitHub</div>
          </button>
          <button
            onClick={() => onNavigate("https://www.twitter.com")}
            className="rounded-lg bg-neutral-100 p-4 transition-colors hover:bg-neutral-200"
          >
            <div className="mb-2 text-lg">🐦</div>
            <div>Twitter</div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewTabPage;
