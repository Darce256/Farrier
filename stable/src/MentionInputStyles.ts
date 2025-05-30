export default {
  control: {
    position: "relative",
    backgroundColor: "#fff",
    fontSize: 16,
    height: "200px",
    fontFamily: "inherit",
    zIndex: 0,
    "&focused": {
      borderColor: "#e11d48", // This sets the border color when focused
      outline: "none", // This removes the default focus outline
    },
  },
  "&multiLine": {
    control: {
      fontFamily: "inherit",
      minHeight: 63,
    },
    highlighter: {
      padding: 9,
      border: "1px solid transparent",
    },
    input: {
      padding: 9,
      border: "1px solid silver",
      borderRadius: "5px", // Add this for consistent rounding
      transition: "border-color 0.3s ease", // Smooth transition for the border color change
      "&focused": {
        borderColor: "#e11d48", // This sets the border color when focused
        outline: "none", // This removes the default focus outline
      },
    },
  },
  "&singleLine": {
    display: "inline-block",
    width: 180,
    highlighter: {
      padding: 1,
      border: "2px inset transparent",
    },
    input: {
      padding: 1,
      border: "2px inset",
      "&focused": {
        borderColor: "#e11d48", // This sets the border color when focused
        outline: "none", // This removes the default focus outline
      },
    },
  },
  suggestions: {
    list: {
      backgroundColor: "white", // Changed from #e11d48 for better contrast
      border: "1px solid rgba(0,0,0,0.15)",
      borderRadius: "5px",
      fontSize: 16,
    },
    item: {
      padding: "5px 15px",
      borderBottom: "1px solid rgba(0,0,0,0.15)",
      borderRadius: "5px",
      "&focused": {
        backgroundColor: "#e11d48",
        color: "white",
      },
    },
  },
};
