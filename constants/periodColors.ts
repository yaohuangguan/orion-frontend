
export interface PeriodColor {
    label: string;
    desc: string;
    colorCode: string;
  }
  
  export const PERIOD_COLORS: Record<string, PeriodColor> = {
    RED_FRESH: {
      label: "鲜红色",
      desc: "正常 (经期中后段)",
      colorCode: "#FF0000"
    },
    RED_DARK: {
      label: "暗红色",
      desc: "正常 (经期初/末期)",
      colorCode: "#8B0000"
    },
    BROWN: {
      label: "深褐色",
      desc: "作息/压力影响",
      colorCode: "#654321"
    },
    PINK: {
      label: "粉红色",
      desc: "警惕激素低",
      colorCode: "#FFC0CB"
    },
    ORANGE: {
      label: "橙红色",
      desc: "警惕感染",
      colorCode: "#FF4500"
    },
    BLACK: {
      label: "黑色",
      desc: "淤积严重",
      colorCode: "#000000"
    },
    OTHER: {
      label: "其他",
      desc: "未分类",
      colorCode: "#CCCCCC"
    }
  };
  
  export const PERIOD_COLOR_OPTIONS = Object.keys(PERIOD_COLORS).map(key => ({
    value: key,
    ...PERIOD_COLORS[key]
  }));
  