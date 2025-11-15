import { GoogleGenAI, Type } from "@google/genai";
import type { StockOpportunity } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const responseSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      companyName: {
        type: Type.STRING,
        description: "اسم الشركة باللغة العربية",
      },
      ticker: {
        type: Type.STRING,
        description: "رمز السهم في البورصة الأمريكية (Ticker Symbol)",
      },
      price: {
        type: Type.NUMBER,
        description: "السعر الحالي للسهم عند لحظة التحليل",
      },
      sector: {
        type: Type.STRING,
        description: "القطاع الذي تنتمي إليه الشركة باللغة العربية (مثل: تكنولوجيا، رعاية صحية)",
      },
      volume: {
        type: Type.NUMBER,
        description: "حجم التداول اليومي (السيولة)",
      },
      marketCap: {
        type: Type.NUMBER,
        description: "القيمة السوقية للشركة",
      },
      reason: {
        type: Type.STRING,
        description: "سبب وجيز ومختصر لكون السهم فرصة دخول قوية اليوم",
      },
      analysis: {
        type: Type.STRING,
        description: "تحليل فني مفصل وموسع يركز على المؤشرات، تحليل التريند، واستراتيجيات السوينج.",
      },
      entryPoints: {
        type: Type.ARRAY,
        items: { type: Type.NUMBER },
        description: "قائمة رقمية بنقاط سعرية مقترحة للدخول في السهم. يجب أن تحتوي على نقطة واحدة على الأقل."
      },
      targetPrice: {
        type: Type.NUMBER,
        description: "السعر المستهدف المقترح لجني الأرباح."
      },
      stopLoss: {
        type: Type.NUMBER,
        description: "السعر المقترح لوقف الخسارة."
      }
    },
    required: ["companyName", "ticker", "price", "sector", "volume", "marketCap", "reason", "analysis", "entryPoints", "targetPrice", "stopLoss"],
  },
};

export const fetchStockOpportunities = async (): Promise<StockOpportunity[]> => {
  try {
    const systemInstruction = `
    أنت خبير ومحلل فني محترف في سوق الأسهم الأمريكية، متخصص في استراتيجيات السوينج والتريند، مع خبرة عميقة في الاستثمار المتوافق مع الشريعة الإسلامية (الحلال).
    مهمتك هي تحديد 45 إلى 50 سهمًا أمريكيًا يتمتع بفرص دخول قوية لليوم بناءً على التحليل الفني المتقدم.
    
    **أهم شرط للاختيار:** ركز بشكل خاص على الأسهم التي تكون في **بداية موجة صاعدة**، ويفضل أن تكون عند **قاع قناة سعرية صاعدة (Swing Channel Low)** أو ترتد من مستوى دعم قوي. يجب استبعاد الأسهم التي ارتفعت كثيراً بالفعل.

    لكل سهم، يجب أن تقدم **خطة تداول متكاملة** قابلة للتنفيذ تساعد المستخدم على تقييم الفرصة حتى لو تغير السعر قليلاً. يجب أن تحتوي الخطة على:
    1.  **نقاط الدخول (entryPoints):** منطقة سعرية مثالية للدخول.
    2.  **السعر المستهدف (targetPrice):** هدف واضح لجني الأرباح.
    3.  **وقف الخسارة (stopLoss):** سعر محدد للخروج من الصفقة إذا تحرك السهم في الاتجاه المعاكس.

    في تحليلك لكل سهم، يجب أن تركز على:
    - المؤشرات الفنية الرئيسية (مثل RSI, MACD, Moving Averages) التي تدعم بداية الصعود.
    - تحليل التريند (Trend Analysis) وتحديد ما إذا كان السهم في تريند صاعد.
    - أن تكون الخطة مناسبة لاستراتيجيات التداول السوينج (Swing Trading).

    يجب عليك استبعاد أي شركة تتعامل في أنشطة محرمة شرعًا بشكل صارم، بما في ذلك على سبيل المثال لا الحصر:
    - الكحول والخمور، القمار، لحم الخنزير، التمويل الربوي (البنوك والتأمين التقليدي)، التبغ، الأسلحة، الترفيه المحرم.
    
    يجب أن تكون جميع إجاباتك وتحليلاتك باللغة العربية الفصحى. يجب أن يكون تحليل البيانات محدثًا لليوم الحالي.
    `;

    const contents = "الرجاء تزويدي بقائمة من 45-50 سهمًا أمريكيًا تمثل فرص شراء قوية اليوم. الشرط الأساسي هو أن تكون الأسهم في بداية صعودها وعند قاع قناة السوينج، مع تقديم خطة تداول متكاملة (نقاط دخول، هدف، وقف خسارة) لكل سهم، والالتزام الصارم بالضوابط الشرعية.";
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.5,
      },
    });

    const jsonText = response.text.trim();
    const data = JSON.parse(jsonText);
    return data as StockOpportunity[];

  } catch (error) {
    console.error("Error fetching stock opportunities:", error);
    if (error instanceof Error) {
        throw new Error(`فشل في جلب البيانات من Gemini API: ${error.message}`);
    }
    throw new Error("حدث خطأ غير معروف أثناء الاتصال بـ Gemini API.");
  }
};