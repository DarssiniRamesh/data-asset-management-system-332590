/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#2563EB", // blue
          accent: "#F59E0B", // amber
        },
      },
      boxShadow: {
        soft: "0 10px 30px rgba(17, 24, 39, 0.08)",
      },
      backgroundImage: {
        "hero-gradient":
          "radial-gradient(1200px 600px at 10% 10%, rgba(37,99,235,0.25), transparent 55%), radial-gradient(900px 500px at 90% 0%, rgba(245,158,11,0.18), transparent 50%), radial-gradient(1000px 700px at 60% 100%, rgba(99,102,241,0.15), transparent 60%)",
      },
    },
  },
  plugins: [],
};
