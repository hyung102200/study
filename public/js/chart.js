// 차트 인스턴스
let chart;
let allData = [];
const ctx = document.getElementById("exchangeRateChart").getContext("2d");

// 빈 차트 초기화
function initChart() {
  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "환율 (원)",
          data: [],
          borderColor: "#2196F3",
          backgroundColor: "rgba(33, 150, 243, 0.1)",
          borderWidth: 2,
          pointRadius: 2,
          pointHoverRadius: 5,
          tension: 0.1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          title: {
            display: true,
            text: "날짜",
          },
          ticks: {
            maxTicksLimit: 10,
          },
        },
        y: {
          title: {
            display: true,
            text: "환율 (원)",
          },
          grid: {
            display: true,
            color: "#E0E0E0",
          },
        },
      },
      plugins: {
        tooltip: {
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          titleColor: "#FFFFFF",
          bodyColor: "#FFFFFF",
          callbacks: {
            label: function (context) {
              const date = context.label;
              const rate = context.parsed.y;
              return `날짜: ${date}, 환율: ${rate.toFixed(2)}원`;
            },
          },
        },
        legend: {
          display: true,
          position: "top",
        },
      },
    },
  });
}

// API에서 데이터 가져오기
async function fetchData(startDate = null, endDate = null) {
  let url = "/api/data";
  if (startDate && endDate) {
    url += `?start=${startDate}&end=${endDate}`;
  }

  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching data:", error);
    return [];
  }
}

// 차트 업데이트
function updateChart(data) {
  const labels = data.map((item) => item.date);
  const rates = data.map((item) => item.rate);

  chart.data.labels = labels;
  chart.data.datasets[0].data = rates;
  chart.update();
}

// 날짜 계산 함수
function calculateDateRange(years) {
  const endDate = new Date();
  const startDate = new Date();

  if (years === "max") {
    // 전체 데이터 사용
    return { startDate: null, endDate: null };
  }

  startDate.setFullYear(endDate.getFullYear() - years);

  // YYYY-MM-DD 형식으로 변환
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
  };
}

// 로컬 데이터 필터링 함수
function filterLocalData(startDate, endDate) {
  if (!startDate && !endDate) {
    return allData;
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  return allData.filter((item) => {
    const itemDate = new Date(item.date);
    return itemDate >= start && itemDate <= end;
  });
}

// 페이지 로드 시 초기화
document.addEventListener("DOMContentLoaded", async () => {
  initChart();

  // 전체 데이터 로드 및 저장
  allData = await fetchData();
  updateChart(allData);

  // 날짜 선택기 이벤트 리스너
  const applyBtn = document.getElementById("applyBtn");
  const resetBtn = document.getElementById("resetBtn");
  const startDateInput = document.getElementById("startDate");
  const endDateInput = document.getElementById("endDate");
  const quickButtons = document.querySelectorAll(".quick-btn");

  // 적용 버튼 클릭
  applyBtn.addEventListener("click", async () => {
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;

    if (startDate && endDate) {
      const data = await fetchData(startDate, endDate);
      updateChart(data);
    } else {
      alert("시작 날짜와 종료 날짜를 모두 선택해주세요.");
    }
  });

  // 전체 기간 보기 버튼 클릭
  resetBtn.addEventListener("click", async () => {
    startDateInput.value = "";
    endDateInput.value = "";
    const data = await fetchData();
    updateChart(data);
  });

  // 빠른 선택 버튼 클릭
  quickButtons.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const years = btn.getAttribute("data-years");
      const { startDate, endDate } = calculateDateRange(years);

      // 날짜 입력 필드 업데이트
      if (startDate && endDate) {
        startDateInput.value = startDate;
        endDateInput.value = endDate;
      } else {
        startDateInput.value = "";
        endDateInput.value = "";
      }

      // 로컬 데이터 필터링 및 차트 업데이트
      const filteredData = filterLocalData(startDate, endDate);
      updateChart(filteredData);
    });
  });
});
