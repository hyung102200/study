const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;

// 정적 파일 서빙 설정
app.use(express.static(path.join(__dirname, "public")));

// CSV 파일 읽기 함수
function readCSVFile() {
  const csvData = fs.readFileSync(path.join(__dirname, "usd2won.csv"), "utf8");
  return csvData;
}

// CSV 파싱 함수
function parseCSV(csvData) {
  const lines = csvData.trim().split("\n");
  const headers = lines[0].split(",");
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",");
    if (values.length >= 2) {
      const date = values[0].trim();
      const rate = parseFloat(values[1].trim());
      data.push({ date, rate });
    }
  }

  return data;
}

// 0 값 필터링 함수
function filterZeroValues(data) {
  return data.filter((item) => item.rate !== 0);
}

// 기본 라우트
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 데이터 제공 엔드포인트
app.get("/api/data", (req, res) => {
  try {
    const csvData = readCSVFile();
    const parsedData = parseCSV(csvData);
    let filteredData = filterZeroValues(parsedData);

    // 시간 구간 필터링
    const { start, end } = req.query;
    if (start && end) {
      const startDate = new Date(start);
      const endDate = new Date(end);
      filteredData = filteredData.filter((item) => {
        const itemDate = new Date(item.date);
        return itemDate >= startDate && itemDate <= endDate;
      });
    }

    res.json(filteredData);
  } catch (error) {
    console.error("Error processing CSV:", error);
    res.status(500).json({ error: "Failed to process CSV data" });
  }
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
