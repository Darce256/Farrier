export default {
  control: {
    position: "relative",
    backgroundColor: "#fff",
    fontSize: 16,
    height: "200px",
    fontFamily: "inherit",
    zIndex: 0,
    // fontWeight: 'normal',
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
    },
  },

  suggestions: {
    list: {
      backgroundColor: "lightgray",
      border: "1px solid rgba(0,0,0,0.15)",
      fontSize: 16,
    },
    item: {
      padding: "5px 15px",
      borderBottom: "1px solid rgba(0,0,0,0.15)",
      "&focused": {
        backgroundColor: "gray",
        color: "white",
      },
    },
  },
};
