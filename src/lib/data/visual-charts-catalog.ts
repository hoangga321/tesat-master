import { TesatSubcategory, TesatVisualChart, TesatVisualChartType } from "@/lib/schemas/tesat-schema";

export const VISUAL_CHARTS_CATALOG: Record<TesatVisualChartType, TesatVisualChart> = {
  PPF_OPPORTUNITY_COST: {
    chartType: "PPF_OPPORTUNITY_COST",
    figureCode: "<그림 1-A>",
    titleKo: "생산가능곡선(PPF)과 기회비용 및 효율적 자원배분",
    titleVi: "Đường giới hạn khả năng sản xuất (PPF), Chi phí cơ hội & Phân bổ nguồn lực",
    source: "한경 TESAT 경제이론 표준 모형",
    xAxisLabelKo: "X재 생산량 (단위: 개)",
    xAxisLabelVi: "Sản lượng hàng X (Đơn vị)",
    yAxisLabelKo: "Y재 생산량 (단위: 개)",
    yAxisLabelVi: "Sản lượng hàng Y (Đơn vị)",
    annotationsKo: [
      "점 A → 점 B 이동 시 포기한 ΔY가 X재 추가 생산의 기회비용(암묵적 비용 포함)",
      "곡선 내부 점 I: 유휴 자원 존재(비효율적 생산), 곡선 외부 점 U: 현재 기술로 달성 불가능",
      "원점에 대해 오목한 형태: 기회비용 체증의 법칙 작용",
    ],
    annotationsVi: [
      "Di chuyển từ điểm A → B: lượng ΔY phải từ bỏ chính là Chi phí cơ hội (기회비용) của ΔX",
      "Điểm I (bên trong đường cong): Sản xuất kém hiệu quả; Điểm U (bên ngoài): Không thể đạt được",
      "Đường cong lõm về gốc tọa độ O: Quy luật chi phí cơ hội ngày càng tăng",
    ],
    readingTipVi:
      "Mẹo đọc đồ thị 5s: Mọi điểm nằm TRÊN đường PPF (A, B, C) đều đạt hiệu quả tối đa; độ dốc tiếp tuyến |ΔY/ΔX| chính là Chi phí cơ hội của hàng X.",
  },

  ELASTICITY_REVENUE: {
    chartType: "ELASTICITY_REVENUE",
    figureCode: "<그림 1-B>",
    titleKo: "수요의 가격탄력성(|Ed|) 구간과 총수입(TR = P × Q) 변화",
    titleVi: "Độ co giãn của cầu theo giá (|Ed|) & Sự thay đổi Tổng doanh thu (TR = P × Q)",
    source: "한경 TESAT 미시경제 기출 도해",
    xAxisLabelKo: "수요량 Q (단위: 천 개)",
    xAxisLabelVi: "Lượng cầu Q (Nghìn sản phẩm)",
    yAxisLabelKo: "가격 P / 총수입 TR",
    yAxisLabelVi: "Giá P / Tổng doanh thu TR",
    annotationsKo: [
      "탄력적 구간(|Ed| > 1): 가격(P) 인하 시 수요량(Q)이 더 크게 증가하여 총수입(TR) 증가",
      "단위탄력적 점(|Ed| = 1): 한계수입(MR) = 0 이며 총수입(TR)이 극대화되는 지점",
      "비탄력적 구간(|Ed| < 1): 가격(P) 인상 시 수요량 감소폭이 작아 총수입(TR) 증가",
    ],
    annotationsVi: [
      "Miền co giãn nhiều (|Ed| > 1): Giảm giá P làm Q tăng mạnh hơn → Tổng doanh thu TR tăng",
      "Điểm co giãn đơn vị (|Ed| = 1): Doanh thu biên MR = 0, Tổng doanh thu TR đạt cực đại",
      "Miền kém co giãn (|Ed| < 1): Tăng giá P làm Q giảm rất ít → Tổng doanh thu TR tăng",
    ],
    readingTipVi:
      "Mẹo đọc đồ thị 5s: Cầu thoải (|Ed| > 1, hàng xa xỉ/nhiều hàng thay thế) → Muốn tăng TR phải GIẢM GIÁ. Cầu dốc đứng (|Ed| < 1, hàng thiết yếu) → Muốn tăng TR phải TĂNG GIÁ.",
  },

  SUPPLY_DEMAND_SHIFT: {
    chartType: "SUPPLY_DEMAND_SHIFT",
    figureCode: "<그림 1-C>",
    titleKo: "완전경쟁시장 수요(D)·공급(S) 곡선 이동과 시장균형(E0 → E1)",
    titleVi: "Dịch chuyển đường Cung (S) - Cầu (D) và Điểm cân bằng thị trường (E0 → E1)",
    source: "한경 생글생글 테샛 기출 분석",
    xAxisLabelKo: "거래량 (Q)",
    xAxisLabelVi: "Sản lượng giao dịch (Q)",
    yAxisLabelKo: "가격 (P)",
    yAxisLabelVi: "Mức giá (P)",
    annotationsKo: [
      "수요 증가(D0 → D1 우측 이동): 소득 증가(정상재), 대체재 가격 상승, 보완재 가격 하락",
      "공급 감소(S0 → S1 좌측 이동): 원자재 가격 상승, 생산기술 퇴보, 공급자 수 감소",
      "균형점 이동: 수요 우측 이동 시 (P↑, Q↑) / 공급 좌측 이동 시 (P↑, Q↓)",
    ],
    annotationsVi: [
      "Cầu tăng (D0 → D1 dịch sang phải): Thu nhập tăng (hàng thông thường), giá hàng thay thế tăng, giá hàng bổ sung giảm",
      "Cung giảm (S0 → S1 dịch sang trái): Giá nguyên liệu tăng, nhà máy phá sản, chi phí sản xuất tăng",
      "Dịch chuyển cân bằng: D dịch phải → (P↑, Q↑); S dịch trái → (P↑, Q↓)",
    ],
    readingTipVi:
      "Mẹo đọc đồ thị 5s: Hàng bổ sung (보완재, Exy < 0) đi NGƯỢC chiều giá; Hàng thay thế (대체재, Exy > 0) đi CÙNG chiều giá.",
  },

  PRICE_CONTROL_CEILING_FLOOR: {
    chartType: "PRICE_CONTROL_CEILING_FLOOR",
    figureCode: "<그림 1-D>",
    titleKo: "정부의 가격통제(최고가격제 Pc · 최저가격제 Pf)와 자중손실(DWL)",
    titleVi: "Kiểm soát giá của Chính phủ (Giá trần Pc · Giá sàn Pf) & Tổn thất vô ích (DWL)",
    source: "한경 TESAT 미시경제 핵심 그래프",
    xAxisLabelKo: "수량 (Q)",
    xAxisLabelVi: "Sản lượng (Q)",
    yAxisLabelKo: "가격 (P)",
    yAxisLabelVi: "Mức giá (P)",
    annotationsKo: [
      "최고가격제(가격상한제, Pc < P*): 초과수요(Qd - Qs) 및 암시장 발생, 거래량 Qs로 축소",
      "최저가격제(가격하한제, Pf > P*): 초과공급(Qs - Qd) 및 비자발적 실업(최저임금제) 발생",
      "빗금 친 삼각형(ΔABC): 거래량 감소(Q* → Q1)로 인해 사라진 사회적 순손실(자중손실)",
    ],
    annotationsVi: [
      "Giá trần (가격상한제, Pc < P*): Gây Dư cầu / Khan hiếm (초과수요 = Qd - Qs) và chợ đen",
      "Giá sàn (가격하한제, Pf > P*): Gây Dư cung (초과공급 = Qs - Qd) và thất nghiệp (lương tối thiểu)",
      "Tam giác gạch chéo (ΔABC): Tổn thất vô ích xã hội (자중손실 - Deadweight Loss) do sản lượng giảm từ Q* về Q1",
    ],
    readingTipVi:
      "Mẹo đọc đồ thị 5s: Giá trần (상한제) có hiệu lực nằm DƯỚI P* → gây DƯ CẦU (초과수요). Giá sàn (하한제) có hiệu lực nằm TRÊN P* → gây DƯ CUNG (초과공급). Cả hai đều làm giảm tổng thặng dư xã hội!",
  },

  INDIFFERENCE_BUDGET: {
    chartType: "INDIFFERENCE_BUDGET",
    figureCode: "<그림 1-E>",
    titleKo: "소비자 무차별곡선(U)과 예산선(BL)의 최적 선택점(E*)",
    titleVi: "Đường bàng quan (U), Đường ngân sách (BL) & Điểm tiêu dùng tối ưu (E*)",
    source: "한경 TESAT 소비자이론 표준 그래프",
    xAxisLabelKo: "X재 소비량 (Qx)",
    xAxisLabelVi: "Lượng tiêu dùng hàng X (Qx)",
    yAxisLabelKo: "Y재 소비량 (Qy)",
    yAxisLabelVi: "Lượng tiêu dùng hàng Y (Qy)",
    annotationsKo: [
      "예산선 기울기 = Px / Py, 무차별곡선 접선 기울기 = 한계대체율(MRSxy = MUx / MUy)",
      "효용 극대화 조건(점 E*): MUx / Px = MUy / Py (1원당 한계효용 균등의 법칙)",
      "만약 MUx/Px < MUy/Py 이면: Y재 소비를 늘리고 X재 소비를 줄여야 효용 증가",
    ],
    annotationsVi: [
      "Độ dốc đường ngân sách = Px / Py; Độ dốc đường bàng quan = MRSxy = MUx / MUy",
      "Điều kiện tối ưu tại tiếp điểm E*: MUx / Px = MUy / Py (Hữu dụng biên trên mỗi 1 won bằng nhau)",
      "Nếu MUx/Px < MUy/Py: Phải tăng mua Y và giảm mua X để đạt đường bàng quan cao hơn",
    ],
    readingTipVi:
      "Mẹo đọc đồ thị 5s: Luôn lấy Hữu dụng biên chia cho Giá (MU/P). Bên nào có MU/P lớn hơn thì tăng mua hàng đó!",
  },

  EXTERNALITY_PIGOU: {
    chartType: "EXTERNALITY_PIGOU",
    figureCode: "<그림 1-F>",
    titleKo: "부정적 외부효과(공해)와 사회적 최적 생산량(Q*) 및 피구세",
    titleVi: "Ngoại ứng tiêu cực (Ô nhiễm), Sản lượng tối ưu xã hội (Q*) & Thuế Pigou",
    source: "한경 TESAT 시장실패와 정부개입",
    xAxisLabelKo: "생산량 (Q)",
    xAxisLabelVi: "Sản lượng (Q)",
    yAxisLabelKo: "가격·비용·편익 (P, MC, MB)",
    yAxisLabelVi: "Giá · Chi phí · Lợi ích biên",
    annotationsKo: [
      "사적 한계비용(PMC) < 사회적 한계비용(SMC = PMC + 외부한계비용 MD)",
      "시장 균형점(Em): Qm에서 결정되어 사회적 최적(Q*)보다 과다 생산(Qm > Q*) 발생",
      "외부비용만큼 피구세(Pigouvian Tax) 부과 시 PMC가 SMC로 이동하여 사회적 최적 달성",
    ],
    annotationsVi: [
      "Chi phí biên tư nhân (PMC) < Chi phí biên xã hội (SMC = PMC + Thiệt hại ô nhiễm biên)",
      "Thị trường tự do (Em) sản xuất tại Qm > Q* (Sản xuất QUÁ MỨC - 과다 생산)",
      "Đánh Thuế Pigou (피구세) bằng đúng chi phí ngoại ứng giúp dịch PMC lên SMC, đưa sản lượng về Q*",
    ],
    readingTipVi:
      "Mẹo đọc đồ thị 5s: Ngoại ứng tiêu cực (부정적 외부효과) → Sản xuất QUÁ MỨC (과다생산, Qm > Q*) → Phạt bằng Thuế Pigou (피구세). Ngoại ứng tích cực → Sản xuất QUÁ ÍT (과소생산) → Trợ cấp (보조금).",
  },

  TAX_SUBSIDY_DWL: {
    chartType: "TAX_SUBSIDY_DWL",
    figureCode: "<그림 1-G>",
    titleKo: "조세 부과에 따른 공급곡선 이동(S → S+t)과 조세귀착·자중손실",
    titleVi: "Đánh thuế làm dịch chuyển đường cung (S → S+t), Phân chia gánh nặng thuế & DWL",
    source: "한경 TESAT 재정학·미시경제 기출",
    xAxisLabelKo: "거래량 (Q)",
    xAxisLabelVi: "Sản lượng giao dịch (Q)",
    yAxisLabelKo: "가격 (P)",
    yAxisLabelVi: "Mức giá (P)",
    annotationsKo: [
      "단위당 조세(t) 부과 시 공급곡선이 수직으로 t만큼 상방 이동(S0 → St), 거래량 감소(Q0 → Qt)",
      "소비자 조세부담 = (Pc - P0)×Qt / 생산자 조세부담 = (P0 - Ps)×Qt",
      "가격탄력성이 비탄력적인(기울기가 가파른) 경제주체가 조세를 더 많이 부담(조세귀착 원리)",
    ],
    annotationsVi: [
      "Đánh thuế t trên mỗi đơn vị làm đường cung dịch lên trên (S0 → St), sản lượng giảm (Q0 → Qt)",
      "Thuế người mua chịu = (Pc - P0)×Qt; Thuế người bán chịu = (P0 - Ps)×Qt",
      "Nguyên lý quy착 thuế (조세귀착): Bên nào KÉM CO GIÃN hơn (đường dốc hơn) sẽ phải chịu thuế NHIỀU HƠN!",
    ],
    readingTipVi:
      "Mẹo đọc đồ thị 5s: Ai cần hàng hơn (Cầu/Cung kém co giãn - 비탄력적) thì người đó gánh phần diện tích thuế lớn hơn trên đồ thị!",
  },

  AD_AS_MACRO: {
    chartType: "AD_AS_MACRO",
    figureCode: "<그림 2-A>",
    titleKo: "총수요(AD)-총공급(AS) 모형과 거시경제 충격(스태그플레이션·통화정책)",
    titleVi: "Mô hình Tổng cầu (AD) - Tổng cung (AS), Chính sách vĩ mô & Lạm phát đình trệ",
    source: "한경 TESAT 거시경제 표준 모형",
    xAxisLabelKo: "실질 국내총생산 (실질 GDP, Y)",
    xAxisLabelVi: "GDP thực tế (Sản lượng Y)",
    yAxisLabelKo: "물가수준 (P)",
    yAxisLabelVi: "Mức giá chung (P)",
    annotationsKo: [
      "총수요 확장(AD0 → AD1 우측 이동): 기준금리 인하, 통화량 증가, 정부지출 확대 → (물가 P↑, 실질GDP Y↑)",
      "부(-)의 공급충격(AS0 → AS1 좌측 이동): 국제유가·원자재 폭등 → 물가 상승(P↑) 속 경기 침체(Y↓) = 스태그플레이션",
      "장기총공급곡선(LRAS): 완전고용 국민소득(Yf)에서 수직선 형태",
    ],
    annotationsVi: [
      "Mở rộng Tổng cầu (AD0 → AD1 dịch phải): Hạ lãi suất, tăng cung tiền, tăng chi tiêu công → (P↑, Y↑)",
      "Cú sốc cung bất lợi (AS0 → AS1 dịch trái): Giá dầu/nguyên liệu tăng vọt → Giá tăng (P↑) kèm Sản lượng giảm (Y↓) = Stagflation",
      "Tổng cung dài hạn (LRAS): Thẳng đứng tại mức sản lượng tiềm năng toàn dụng (Yf)",
    ],
    readingTipVi:
      "Mẹo đọc đồ thị 5s: AD dịch chuyển làm P và Y đi CÙNG CHIỀU. AS dịch trái (sốc cung giá dầu) làm P tăng nhưng Y giảm (Stagflation - 스태그플레이션).",
  },

  PHILLIPS_CURVE: {
    chartType: "PHILLIPS_CURVE",
    figureCode: "<그림 2-B>",
    titleKo: "단기 필립스 곡선(SRPC)과 장기 수직 필립스 곡선(LRPC)",
    titleVi: "Đường cong Phillips ngắn hạn (SRPC) và dài hạn (LRPC)",
    source: "한경 TESAT 거시경제 물가·실업 분석",
    xAxisLabelKo: "실업률 (u, %)",
    xAxisLabelVi: "Tỷ lệ thất nghiệp (u, %)",
    yAxisLabelKo: "인플레이션율 (π, %)",
    yAxisLabelVi: "Tỷ lệ lạm phát (π, %)",
    annotationsKo: [
      "단기 필립스 곡선(SRPC): 실업률(u)과 인플레이션율(π) 간 우하향 상충관계(Trade-off) 존재",
      "기대인플레이션(πe) 상승 또는 스태그플레이션 시 SRPC 자체가 우상향 이동(SRPC0 → SRPC1)",
      "장기 필립스 곡선(LRPC): 자연실업률(u_n) 수준에서 수직선 (장기에는 물가-실업 상충관계 소멸)",
    ],
    annotationsVi: [
      "Ngắn hạn (SRPC): Dốc xuống, thể hiện sự đánh đổi (Trade-off) giữa Thất nghiệp (u) và Lạm phát (π)",
      "Khi kỳ vọng lạm phát tăng hoặc sốc cung: Toàn bộ đường SRPC dịch chuyển lên phải (SRPC0 → SRPC1)",
      "Dài hạn (LRPC): Thẳng đứng tại Tỷ lệ thất nghiệp tự nhiên (u_n) — không còn đánh đổi dài hạn",
    ],
    readingTipVi:
      "Mẹo đọc đồ thị 5s: Ngắn hạn = Dốc xuống (đánh đổi Lạm phát & Thất nghiệp). Dài hạn = Thẳng đứng tại Thất nghiệp tự nhiên (자연실업률).",
  },

  LORENZ_GINI: {
    chartType: "LORENZ_GINI",
    figureCode: "<그림 2-C>",
    titleKo: "로렌츠 곡선(Lorenz Curve)과 소득분배 지니계수(Gini Coefficient)",
    titleVi: "Đường cong Lorenz & Hệ số bất bình đẳng thu nhập Gini",
    source: "통계청(KOSIS) 가계금융복지조사 및 한경 TESAT",
    xAxisLabelKo: "인구 누적 점유율 (%)",
    xAxisLabelVi: "Tỷ lệ dân số cộng dồn (%)",
    yAxisLabelKo: "소득 누적 점유율 (%)",
    yAxisLabelVi: "Tỷ lệ thu nhập cộng dồn (%)",
    annotationsKo: [
      "45도 대각선: 완전평등선(지니계수 = 0) / 우하단 직각선: 완전불평등선(지니계수 = 1)",
      "지니계수 공식: 대각선과 로렌츠 곡선 사이 면적(A) ÷ 삼각형 전체 면적(A + B)",
      "소득 불평등이 심화될수록 로렌츠 곡선이 대각선에서 멀어지며 지니계수가 1에 가까워짐",
    ],
    annotationsVi: [
      "Đường chéo 45°: Bình đẳng tuyệt đối (Gini = 0) / Đường gấp khúc: Bất bình đẳng tuyệt đối (Gini = 1)",
      "Công thức Hệ số Gini = Diện tích vùng A ÷ Tổng diện tích tam giác (A + B)",
      "Đường cong Lorenz càng võng xa đường chéo 45° → Diện tích A càng lớn → Bất bình đẳng càng cao",
    ],
    readingTipVi:
      "Mẹo đọc đồ thị 5s: Gini = A / (A + B) nằm từ 0 đến 1. Số càng NHỎ (gần 0, sát đường 45°) thì xã hội càng BÌNH ĐẲNG!",
  },

  BOK_RATE_INFLATION_TREND: {
    chartType: "BOK_RATE_INFLATION_TREND",
    figureCode: "<그래프 2-D>",
    titleKo: "한국은행 기준금리 및 소비자물가 상승률(CPI) 추이",
    titleVi: "Biểu đồ Lãi suất cơ bản Ngân hàng TW Hàn Quốc (BOK) & Lạm phát CPI",
    source: "한국은행 경제통계시스템(ECOS) · 통계청(KOSIS)",
    xAxisLabelKo: "분기 (Quarter)",
    xAxisLabelVi: "Quý (Thời gian)",
    yAxisLabelKo: "금리 및 물가상승률 (%)",
    yAxisLabelVi: "Lãi suất & Tỷ lệ lạm phát (%)",
    seriesLabel1Ko: "소비자물가 상승률(CPI, %)",
    seriesLabel2Ko: "한국은행 기준금리(%)",
    seriesData: [
      { label: "Q1", value1: 5.0, value2: 3.25 },
      { label: "Q2", value1: 4.2, value2: 3.5 },
      { label: "Q3", value1: 3.4, value2: 3.5 },
      { label: "Q4", value1: 2.8, value2: 3.25 },
      { label: "Q5", value1: 2.1, value2: 2.75 },
    ],
    annotationsKo: [
      "물가상승률(CPI)이 목표치(2.0%)를 상회할 때 중앙은행은 기준금리 인상·동결로 긴축 통화정책 유지",
      "물가가 안정세(2.1%)로 둔화되면 기준금리 인하(3.50% → 2.75%)를 통해 내수·투자 진작 도모",
      "피셔 방정식: 실질금리(r) ≈ 명목금리(i) - 기대인플레이션율(πe)",
    ],
    annotationsVi: [
      "Khi lạm phát CPI cao (5.0%), BOK giữ lãi suất cơ bản cao (3.50%) để thắt chặt tiền tệ",
      "Khi CPI hạ nhiệt về sát mục tiêu 2%, BOK cắt giảm lãi suất (3.50% → 2.75%) để kích thích đầu tư",
      "Phương trình Fisher: Lãi suất thực (r) ≈ Lãi suất danh nghĩa (i) - Lạm phát kỳ vọng (πe)",
    ],
    readingTipVi:
      "Mẹo đọc biểu đồ 5s: Khoảng cách giữa đường Lãi suất danh nghĩa và cột Lạm phát CPI chính là Lãi suất thực (실질금리 = i - π).",
  },

  EXCHANGE_RATE_BOP_CHART: {
    chartType: "EXCHANGE_RATE_BOP_CHART",
    figureCode: "<그래프 2-E>",
    titleKo: "원/달러 환율 변동 추이 및 상품·경상수지 영향",
    titleVi: "Biểu đồ Biến động tỷ giá Won/USD & Tác động đến Cán cân vãng lai",
    source: "한국은행 국제수지 통계 · 서울외국환중개",
    xAxisLabelKo: "시점 (월별 추이)",
    xAxisLabelVi: "Thời điểm (Tháng)",
    yAxisLabelKo: "원/달러 환율 (원/$) · 경상수지(억$)",
    yAxisLabelVi: "Tỷ giá (KRW/USD) & Cán cân (100 triệu USD)",
    seriesLabel1Ko: "원/달러 환율 (원)",
    seriesLabel2Ko: "경상수지 흑자 (억 달러)",
    seriesData: [
      { label: "T1", value1: 1280, value2: 35 },
      { label: "T2", value1: 1320, value2: 48 },
      { label: "T3", value1: 1380, value2: 65 },
      { label: "T4", value1: 1420, value2: 82 },
      { label: "T5", value1: 1360, value2: 60 },
    ],
    annotationsKo: [
      "원/달러 환율 상승(1,280원 → 1,420원) = 원화 가치 하락(평가절하) = 달러 강세",
      "원화 가치 하락 시 달러 표시 한국 수출품 가격경쟁력 상승 → 수출 증가 및 경상수지 개선(마샬-러너 조건 충족 시)",
      "반면 수입 원자재의 원화 환산 가격 상승으로 국내 수입물가 상승 압력 및 외채 상환 부담 증가",
    ],
    annotationsVi: [
      "Tỷ giá KRW/USD tăng (1.280 → 1.420 원) = Đồng Won mất giá (원화 평가절하 / 원화 약세)",
      "Khi đồng Won mất giá: Hàng xuất khẩu Hàn Quốc rẻ hơn tính bằng USD → Xuất khẩu tăng, Cán cân vãng lai (경상수지) thặng dư",
      "Ngược lại: Giá hàng nhập khẩu tính bằng Won đắt lên → Tăng lạm phát nhập khẩu và tăng gánh nặng trả nợ ngoại tệ",
    ],
    readingTipVi:
      "Mẹo đọc biểu đồ 5s: Đường tỷ giá đi LÊN (환율 상승) nghĩa là đồng Won YẾU ĐI (원화 가치 하락) → Có lợi cho XUẤT KHẨU (수출 유리), bất lợi cho NHẬP KHẨU!",
  },

  CORP_FINANCE_BAR_LINE: {
    chartType: "CORP_FINANCE_BAR_LINE",
    figureCode: "<그래프 3-A>",
    titleKo: "기업 재무성과(매출·순이익) 및 자기자본이익률(ROE)·부채비율 추이",
    titleVi: "Biểu đồ Tài chính Doanh nghiệp: Doanh thu, Lợi nhuận ròng, ROE & Hệ số nợ",
    source: "금융감독원 전자공시시스템(DART) · 한경 TESAT 경영",
    xAxisLabelKo: "회계연도 (연도별)",
    xAxisLabelVi: "Năm tài chính",
    yAxisLabelKo: "ROE(%) · 부채비율(%)",
    yAxisLabelVi: "ROE (%) & Hệ số nợ (%)",
    seriesLabel1Ko: "부채비율 (부채/자기자본, %)",
    seriesLabel2Ko: "자기자본이익률 (ROE, %)",
    seriesData: [
      { label: "2022", value1: 180, value2: 8.5 },
      { label: "2023", value1: 150, value2: 11.2 },
      { label: "2024", value1: 120, value2: 14.0 },
      { label: "2025", value1: 100, value2: 16.5 },
    ],
    annotationsKo: [
      "회계 등식: 자산(Assets) = 부채(Liabilities) + 자기자본(Equity)",
      "자기자본이익률(ROE) = (당기순이익 ÷ 자기자본) × 100 / 주가수익비율(PER) = 주가 ÷ 주당순이익(EPS)",
      "부채비율(180% → 100%) 하락과 ROE(8.5% → 16.5%) 상승은 재무건전성과 수익성이 동시 개선됨을 의미",
    ],
    annotationsVi: [
      "Phương trình kế toán: Tổng Tài sản (자산) = Nợ phải trả (부채) + Vốn chủ sở hữu (자기자본)",
      "ROE = (Lợi nhuận ròng ÷ Vốn chủ sở hữu) × 100% / PER = Thị giá cổ phiếu ÷ EPS",
      "Cột Hệ số nợ giảm (180% → 100%) kết hợp đường ROE tăng (8.5% → 16.5%) chứng tỏ tài chính lành mạnh và sinh lời cao",
    ],
    readingTipVi:
      "Mẹo đọc biểu đồ 5s: ROE = Lợi nhuận ròng / Vốn chủ sở hữu. Cẩn thận bẫy đề bài cho Tổng tài sản (자산) và Nợ (부채) — phải lấy 자산 - 부채 để ra Vốn chủ sở hữu (자기자본) trước khi chia!",
  },

  GAME_THEORY_MATRIX: {
    chartType: "GAME_THEORY_MATRIX",
    figureCode: "<그림 3-B>",
    titleKo: "과점시장 두 기업(A·B)의 전략적 보수행렬(Payoff Matrix)과 내시균형",
    titleVi: "Ma trận lợi ích Lý thuyết trò chơi (Payoff Matrix) & Cân bằng Nash giữa 2 doanh nghiệp",
    source: "한경 TESAT 상황판단·게임이론 기출",
    xAxisLabelKo: "B기업의 전략 선택 (할인 경쟁 vs 가격 유지)",
    xAxisLabelVi: "Chiến lược của Công ty B",
    yAxisLabelKo: "A기업의 전략 선택",
    yAxisLabelVi: "Chiến lược của Công ty A",
    annotationsKo: [
      "괄호 안의 숫자 (a, b)는 각각 (A기업 보수, B기업 보수)를 나타냄 (단위: 억 원)",
      "우월전략(Dominant Strategy): 상대방 선택과 무관하게 자신에게 항상 더 높은 이익을 주는 전략",
      "용의자의 딜레마: 두 기업 모두 '할인(저가) 전략'이 우월전략이 되어 내시균형(40, 40)이 협조해(70, 70)보다 열등해짐",
    ],
    annotationsVi: [
      "Cặp số (a, b) trong mỗi ô biểu thị (Lợi nhuận Công ty A, Lợi nhuận Công ty B) tính bằng trăm triệu won",
      "Chiến lược trội (우월전략): Lựa chọn luôn mang lại lợi ích cao hơn bất kể đối thủ chọn gì",
      "Thế lưỡng nan của tù nhân (용의자의 딜레마): Cả A và B đều chọn 'Giảm giá' → Cân bằng Nash (40, 40) thấp hơn mức hợp tác (70, 70)",
    ],
    readingTipVi:
      "Mẹo giải Ma trận 5s: Che từng cột để tìm chiến lược trội của A (so số đứng trước), che từng hàng để tìm chiến lược trội của B (so số đứng sau). Ô giao nhau là Cân bằng Nash (내시균형)!",
  },
};

/**
 * Automatically selects the most relevant Korean Economic Visual Chart (<그림 / 그래프>)
 * based on the question's Korean stem, explanation, and subcategory.
 */
export function matchVisualChartForQuestion(
  questionKo: string,
  explanationKo: string,
  subcategory: TesatSubcategory,
  examNumber: number
): TesatVisualChart | undefined {
  const text = `${questionKo} ${explanationKo}`;

  if (/보수행렬|게임이론|내시\s*균형|우월전략|용의자의\s*딜레마|수인의\s*딜레마/.test(text)) {
    return VISUAL_CHARTS_CATALOG.GAME_THEORY_MATRIX;
  }
  if (/로렌츠|지니계수|소득\s*불평등|십분위|오분위/.test(text)) {
    return VISUAL_CHARTS_CATALOG.LORENZ_GINI;
  }
  if (/필립스\s*곡선|자연실업률|스태그플레이션.*실업/.test(text)) {
    return VISUAL_CHARTS_CATALOG.PHILLIPS_CURVE;
  }
  if (/가격상한|가격하한|최고가격|최저가격|최저임금|임대료\s*규제/.test(text)) {
    return VISUAL_CHARTS_CATALOG.PRICE_CONTROL_CEILING_FLOOR;
  }
  if (/외부효과|피구세|코즈\s*정리|사회적\s*최적|과다\s*생산|과소\s*생산/.test(text)) {
    return VISUAL_CHARTS_CATALOG.EXTERNALITY_PIGOU;
  }
  if (/조세\s*부과|조세\s*귀착|물품세|세금.*부담|자중손실.*조세/.test(text)) {
    return VISUAL_CHARTS_CATALOG.TAX_SUBSIDY_DWL;
  }
  if (/기회비용|매몰비용|생산가능곡선|PPF/.test(text)) {
    return VISUAL_CHARTS_CATALOG.PPF_OPPORTUNITY_COST;
  }
  if (/가격탄력성|교차탄력성|소득탄력성|총수입.*탄력|탄력적/.test(text)) {
    return VISUAL_CHARTS_CATALOG.ELASTICITY_REVENUE;
  }
  if (/한계효용|무차별곡선|예산선|한계대체율|효용\s*극대화/.test(text)) {
    return VISUAL_CHARTS_CATALOG.INDIFFERENCE_BUDGET;
  }
  if (/수요곡선|공급곡선|수요가\s*증가|공급이\s*감소|균형가격|대체재|보완재|완전경쟁시장에서\s*재화의\s*가격/.test(text)) {
    return VISUAL_CHARTS_CATALOG.SUPPLY_DEMAND_SHIFT;
  }
  if (/환율|경상수지|국제수지|평가절하|평가절상|원화\s*가치|수출.*수입/.test(text)) {
    return VISUAL_CHARTS_CATALOG.EXCHANGE_RATE_BOP_CHART;
  }
  if (/기준금리|통화정책|중앙은행|한국은행|인플레이션|물가상승률|소비자물가|피셔|실질금리/.test(text)) {
    return VISUAL_CHARTS_CATALOG.BOK_RATE_INFLATION_TREND;
  }
  if (/총수요|총공급|AD-AS|GDP|구축효과|승수효과|경기순환|재정정책/.test(text)) {
    return VISUAL_CHARTS_CATALOG.AD_AS_MACRO;
  }
  if (/ROE|자기자본|부채비율|유동비율|재무제표|영업이익|당기순이익|PER|PBR|주식|채권/.test(text)) {
    return VISUAL_CHARTS_CATALOG.CORP_FINANCE_BAR_LINE;
  }

  // Ensure the first 5 questions of any set or data editorial questions always have visual representation
  if (examNumber <= 5) {
    if (subcategory === "MICRO") return VISUAL_CHARTS_CATALOG.SUPPLY_DEMAND_SHIFT;
    if (subcategory === "MACRO") return VISUAL_CHARTS_CATALOG.AD_AS_MACRO;
    if (subcategory === "INTL") return VISUAL_CHARTS_CATALOG.EXCHANGE_RATE_BOP_CHART;
    if (subcategory === "FINANCE_STRATEGY") return VISUAL_CHARTS_CATALOG.CORP_FINANCE_BAR_LINE;
  }

  return undefined;
}
