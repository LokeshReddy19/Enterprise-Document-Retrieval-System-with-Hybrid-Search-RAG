import React, { useState } from "react";
import axios from "axios";
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Paper,
  List,
  CircularProgress,
  Fade,
  Divider,
  InputAdornment,
  CssBaseline,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import {
  CloudUpload,
  Search,
  Description,
  SmartToy,
} from "@mui/icons-material";

/* ---------- DARK BROWN + STRONG WHITE TEXT THEME ---------- */
const theme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#0f0c08",
      paper: "#1a1410",
    },
    primary: {
      main: "#8B5E3C",
    },
    text: {
      primary: "#FFFFFF",
      secondary: "#E0E0E0",
    },
  },
  typography: {
    fontFamily: "Poppins, sans-serif",
    h2: {
      fontWeight: 800,
      color: "#FFFFFF",
    },
    h5: {
      fontWeight: 700,
      color: "#FFFFFF",
    },
    subtitle2: {
      fontWeight: 600,
      color: "#FFFFFF",
      letterSpacing: 1,
    },
    body1: {
      color: "#FFFFFF",
    },
  },
});

function App() {
  const [file, setFile] = useState(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [chatQuestion, setChatQuestion] = useState("");
  const [chatAnswer, setChatAnswer] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a document first.");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      await axios.post("http://127.0.0.1:8000/upload", formData);
      alert(`${file.name} indexed successfully.`);
      setFile(null);
    } catch (error) {
      alert("Upload failed. Please check backend.");
    }

    setUploading(false);
  };

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);

    try {
      const response = await axios.post(
        `http://127.0.0.1:8000/search?query=${query}`
      );
      setResults(response.data.results || []);
    } catch (error) {
      setResults([]);
    }

    setLoading(false);
  };

  const handleChat = async () => {
    if (!chatQuestion.trim()) return;

    setChatLoading(true);
    setChatAnswer("");

    try {
      const response = await axios.post(
        `http://127.0.0.1:8000/chat?question=${chatQuestion}`
      );
      setChatAnswer(response.data.answer);
    } catch (error) {
      setChatAnswer("Something went wrong.");
    }

    setChatLoading(false);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <Box
        sx={{
          minHeight: "100vh",
          py: 8,
          backgroundColor: "#0f0c08",
        }}
      >
        <Container maxWidth="md">

          {/* HERO */}
          <Box textAlign="center" mb={8}>
            <Typography variant="h2">
              EnterASearch AI
            </Typography>
            <Typography
              variant="h6"
              sx={{
                mt: 1,
                color: "#E0E0E0",
                fontWeight: 500,
              }}
            >
              Hybrid Semantic Search + AI Chat
            </Typography>
          </Box>

          {/* MAIN CARD */}
          <Paper
            elevation={6}
            sx={{
              p: 5,
              borderRadius: 3,
              backgroundColor: "#1a1410",
            }}
          >

            {/* SEARCH */}
            <Box mb={5}>
              <Typography variant="subtitle2">
                HYBRID SEMANTIC SEARCH
              </Typography>

              <TextField
                fullWidth
                variant="standard"
                placeholder="Search documents..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                InputProps={{
                  sx: {
                    color: "#FFFFFF",
                  },
                  endAdornment: (
                    <InputAdornment position="end">
                      <Button
                        variant="contained"
                        onClick={handleSearch}
                        disabled={loading}
                        sx={{
                          backgroundColor: "#8B5E3C",
                          fontWeight: 600,
                        }}
                      >
                        {loading ? (
                          <CircularProgress size={20} color="inherit" />
                        ) : (
                          <Search />
                        )}
                      </Button>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <Divider sx={{ mb: 5, bgcolor: "#2c2119" }} />

            {/* UPLOAD */}
            <Box>
              <Typography variant="subtitle2">
                DOCUMENT INGESTION
              </Typography>

              <Button
                variant="outlined"
                component="label"
                fullWidth
                startIcon={<CloudUpload />}
                sx={{
                  mb: 2,
                  py: 1.5,
                  borderColor: "#8B5E3C",
                  color: "#FFFFFF",
                }}
              >
                {file ? file.name : "Select PDF Document"}
                <input
                  type="file"
                  hidden
                  onChange={(e) => setFile(e.target.files[0])}
                />
              </Button>

              <Button
                fullWidth
                variant="contained"
                disabled={uploading}
                sx={{
                  py: 1.5,
                  backgroundColor: "#8B5E3C",
                  fontWeight: 600,
                }}
                onClick={handleUpload}
              >
                {uploading
                  ? "Extracting & Indexing..."
                  : "Process & Save to Database"}
              </Button>
            </Box>
          </Paper>

          {/* RESULTS */}
          <Box mt={8}>
            <Typography variant="h5">
              {loading
                ? "Searching..."
                : results.length > 0
                ? `Found ${results.length} Results`
                : query
                ? "No Results Found"
                : "No Search Performed"}
            </Typography>

            <List sx={{ p: 0 }}>
              {results.map((res, index) => (
                <Fade in key={index} timeout={400 + index * 150}>
                  <Box
                    sx={{
                      p: 3,
                      borderRadius: 2,
                      mb: 2,
                      backgroundColor: "#1f1813",
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        color: "#FFFFFF",
                        fontWeight: 600,
                      }}
                    >
                      <Description sx={{ mr: 1 }} />
                      {res.filename}
                    </Typography>

                    <Typography sx={{ mt: 1, color: "#E0E0E0" }}>
                      Relevance: <b>{res.relevance}%</b>
                    </Typography>
                  </Box>
                </Fade>
              ))}
            </List>
          </Box>

          {/* CHAT */}
          <Box mt={12}>
            <Typography variant="h5">
              Ask AI About Documents
            </Typography>

            <TextField
              fullWidth
              variant="outlined"
              sx={{ mt: 2 }}
              placeholder="Ask a question..."
              value={chatQuestion}
              onChange={(e) => setChatQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleChat()}
              InputProps={{
                sx: { color: "#FFFFFF" },
              }}
            />

            <Button
              variant="contained"
              startIcon={<SmartToy />}
              onClick={handleChat}
              disabled={chatLoading}
              sx={{
                mt: 2,
                backgroundColor: "#8B5E3C",
                fontWeight: 600,
              }}
            >
              {chatLoading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                "Ask AI"
              )}
            </Button>

            {chatAnswer && (
              <Box
                mt={4}
                sx={{
                  p: 3,
                  borderRadius: 2,
                  backgroundColor: "#1f1813",
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  AI Answer:
                </Typography>
                <Typography sx={{ mt: 1 }}>
                  {chatAnswer}
                </Typography>
              </Box>
            )}
          </Box>

        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
