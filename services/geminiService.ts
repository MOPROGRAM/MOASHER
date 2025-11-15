import { GoogleGenAI, Type } from "@google/genai";
import type { StockOpportunity } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });
const currentYear = new Date().getFullYear();

// Note: The responseSchema objects are no longer passed to the API call
// due to the use of the googleSearch tool, which disallows it.
// They are kept here for documentation purposes.
const sharedProperties = {
  companyName: {
    type: Type.STRING,
    description: "Company name in the requested language (Arabic or English)",
  },
  ticker: {
    type: Type.STRING,
    description: "The stock ticker symbol",
  },
  price: {
    type: Type.NUMBER,
    description: "The latest available closing price of the stock.",
  },
  priceDataDate: {
    type: Type.STRING,
    description: "The exact date (YYYY-MM-DD) of the closing price used for this analysis. This is NON-NEGOTIABLE and CRITICAL for transparency and user trust. You are an analyst, not a real-time data feed.",
  },
  sector: {
    type: Type.STRING,
    description: "The company's sector in the requested language",
  },
  volume: {
    type: Type.NUMBER,
    description: "Daily trading volume (liquidity)",
  },
  marketCap: {
    type: Type.NUMBER,
    description: "Company's market capitalization",
  },
  reason: {
    type: Type.STRING,
    description: "A brief summary of the technical status. If a swing low opportunity exists, state it clearly. If not, state that there is no current entry opportunity. Must be in the requested language.",
  },
  analysis: {
    type: Type.STRING,
    description: "Detailed technical analysis. If an opportunity exists, justify why it meets the mandatory criteria. If not, briefly describe the current technical situation (e.g., 'in a downtrend', 'approaching resistance'). Must be in the requested language.",
  },
  entryPoints: {
    type: Type.ARRAY,
    items: { type: Type.NUMBER },
    description: "If an opportunity exists, a list of suggested entry prices. If not, return an empty array or an array with a single value of 0."
  },
  targetPrice: {
    type: Type.NUMBER,
    description: "If an opportunity exists, the suggested target price. If not, return 0."
  },
  stopLoss: {
    type: Type.NUMBER,
    description: "If an opportunity exists, the suggested stop-loss price. If not, return 0."
  },
  debtToAssetsRatio: {
    type: Type.NUMBER,
    description: "Total Debt to Total Assets ratio as a percentage (e.g., 25.5 for 25.5%). Important for Sharia screening. Use the latest available financial data.",
  },
  interestIncomeRatio: {
    type: Type.NUMBER,
    description: "Interest Income to Total Revenue ratio as a percentage (e.g., 4.1 for 4.1%). Important for Sharia screening. Use the latest available financial data.",
  },
  financialsDate: {
    type: Type.STRING,
    description: "The date of the latest financial report used (e.g., 'Q2 2024'). This date CANNOT be in the future.",
  },
};


export const fetchStockOpportunities = async (language: 'ar' | 'en'): Promise<StockOpportunity[]> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const langInstructions = {
        ar: {
            langName: "Arabic (العربية الفصحى)",
            prompt: `الرجاء تزويدي بقائمة من 45-50 سهمًا أمريكيًا تمثل فرص شراء قوية لليوم بتاريخ ${today}. الشرط الأساسي هو أن تكون الأسهم في بداية صعودها وعند قاع قناة السوينج، مع تقديم خطة تداول متكاملة (نقاط دخول، هدف، وقف خسارة) لكل سهم، وتوفير البيانات المالية المحدثة اللازمة للفلترة الشرعية (نسبة الديون، نسبة دخل الفوائد، القيمة السوقية، والسيولة)، والالتزام الصارم بالضوابط الشرعية.`
        },
        en: {
            langName: "English",
            prompt: `Please provide me with a list of 45-50 US stocks that represent strong buying opportunities for today, ${today}. The primary condition is that the stocks should be at the beginning of an uptrend, ideally at a Swing Channel Low. Provide a complete trading plan (entry points, target, stop loss) for each stock, along with the updated financial data necessary for Sharia screening (debt ratio, interest income ratio, market cap, and liquidity). Strictly adhere to Islamic finance principles.`
        }
    }

    const systemInstruction = `
    You are an expert technical analyst in the US stock market, specializing in swing and trend strategies, with deep expertise in Islamic (Halal) compliant investing.
    Your task is to identify 45 to 50 US stocks with strong entry opportunities for today, ${today}, based on advanced technical analysis.
    
    CURRENT_DATE_FOR_ANALYSIS = ${today}

    **MANDATORY TECHNICAL CRITERIA FOR 'SWING CHANNEL LOW':**
    1.  **Established Upward Channel:** The stock MUST be in a clearly defined upward-trending channel.
    2.  **Contact with Support:** The stock's price action MUST be touching or have just touched the lower support trendline.
    3.  **Confirmation of Bounce:** There MUST be technical evidence of a potential bounce or reversal from the support line.
    4.  **Justification:** Your 'analysis' for each stock MUST explicitly state HOW it meets these three criteria.

    **(EXTREMELY CRITICAL - NON-NEGOTIABLE) DATA FRESHNESS & ACCURACY DIRECTIVES:**
    - **USER COMPLAINT:** Users have reported receiving outdated stock prices repeatedly. This is a critical, mission-failing problem. You must prioritize data freshness above all else.
    - **FORBIDDEN KNOWLEDGE:** Your internal, pre-trained knowledge of stock prices is **STRICTLY FORBIDDEN** for use in this task. It is old and incorrect. You MUST NOT use it under any circumstances for current price data.
    - **MANDATORY TOOL USAGE:** You **MUST** use the \`googleSearch\` tool for **EVERY SINGLE STOCK** to find its latest closing price. There are no exceptions. Failure to use the tool for each stock will result in an incorrect and useless response.
        - **Example Google Search for Price:** "latest closing price for [TICKER] on ${today}"
    - **PRICE VERIFICATION (CRITICAL):** The 'price' field **MUST** be the latest closing price from the search result. The 'priceDataDate' field **MUST** be the exact date (YYYY-MM-DD) of that closing price, which you will also get from the search. This 'priceDataDate' **MUST match or be the immediate prior market day to CURRENT_DATE_FOR_ANALYSIS**. If the 'priceDataDate' is older than this, your response is considered completely invalid and a failure.
    - **FINANCIAL DATA:** Financial data ('debtToAssetsRatio', 'interestIncomeRatio') **MUST** be sourced from the most recent financial reports (10-Q/10-K) for the current year, ${currentYear}.
    - **CONSEQUENCE OF FAILURE:** Any response generated using outdated, internal knowledge for stock prices or an incorrect 'priceDataDate' is considered a complete failure and will be rejected. You must prove you have used the tool by providing the correct, current data as per CURRENT_DATE_FOR_ANALYSIS.

    **CRITICAL OUTPUT FORMATTING:**
    Your ENTIRE response MUST be a single, valid JSON array string. Do NOT include any introductory text, markdown formatting (like \`\`\`json), or explanations outside of the JSON array itself. The JSON must be an array of objects, where each object has the following keys: "companyName", "ticker", "price", "priceDataDate", "sector", "volume", "marketCap", "reason", "analysis", "entryPoints", "targetPrice", "stopLoss", "debtToAssetsRatio", "interestIncomeRatio", "financialsDate".

    You must strictly exclude any company involved in activities prohibited by Sharia law.
    All your responses, analysis, and company data must be in the requested language: **${langInstructions[language].langName}**. The data analysis must be current for today, ${today}.
    `;

    const contents = langInstructions[language].prompt;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: contents,
      tools: [{googleSearch: {}}],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.2,
      },
    });

    const rawText = response.text;
    const jsonMatch = rawText.match(/```(json)?\s*([\s\S]*?)\s*```/);
    const jsonText = jsonMatch ? jsonMatch[2] : rawText;

    const data = JSON.parse(jsonText.trim());
    return data as StockOpportunity[];

  } catch (error) {
    console.error("Error fetching stock opportunities:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to fetch data from Gemini API: ${error.message}`);
    }
    throw new Error("An unknown error occurred while contacting the Gemini API.");
  }
};


export const fetchSingleStockAnalysis = async (ticker: string, language: 'ar' | 'en'): Promise<StockOpportunity> => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const langInstructions = {
            ar: {
                langName: "Arabic (العربية الفصحى)",
                prompt: `الرجاء تحليل السهم الأمريكي برمز '${ticker}' لليوم بتاريخ ${today}. قم بتوفير البيانات الشرعية (نسبة الديون، نسبة الفوائد) من أحدث تقرير مالي. ثم، قم بتحليل ما إذا كان يمثل فرصة "قاع سوينج" حسب المعايير الفنية الإلزامية. إذا كانت هناك فرصة، قدم خطة تداول كاملة. إذا لم تكن هناك فرصة، وضح ذلك في التحليل وأعد قيم الخطة (نقاط الدخول، الهدف، الوقف) كأصفار.`
            },
            en: {
                langName: "English",
                prompt: `Please analyze the US stock with ticker '${ticker}' for today, ${today}. Provide its Sharia compliance data (debt ratio, interest ratio) from the very latest financial report. Then, analyze if it represents a 'Swing Channel Low' opportunity based on the mandatory technical criteria. If an opportunity exists, provide a full trading plan. If no opportunity exists, state that clearly in the analysis and return the trading plan values (entry points, target, stop loss) as zeros.`
            }
        };

        const systemInstruction = `
        You are an expert technical analyst and Sharia compliance screener for the US stock market.
        Your task is to analyze a single stock provided by the user for today, ${today}.

        CURRENT_DATE_FOR_ANALYSIS = ${today}

        **(EXTREMELY CRITICAL - NON-NEGOTIABLE) DATA FRESHNESS & ACCURACY DIRECTIVES:**
        - **USER COMPLAINT:** Users have reported receiving outdated stock prices repeatedly. This is a critical, mission-failing problem. You must prioritize data freshness above all else.
        - **FORBIDDEN KNOWLEDGE:** Your internal, pre-trained knowledge of stock prices is **STRICTLY FORBIDDEN** for use in this task. It is old and incorrect. You MUST NOT use it under any circumstances for current price data.
        - **MANDATORY TOOL USAGE:** You **MUST** use the \`googleSearch\` tool to find the latest closing price for the requested stock ticker. There are no exceptions. Failure to use the tool will result in an incorrect and useless response.
            - **Example Google Search for Price:** "latest closing price for ${ticker} on ${today}"
        - **PRICE VERIFICATION (CRITICAL):** The 'price' field **MUST** be the latest closing price from the search result. The 'priceDataDate' field **MUST** be the exact date (YYYY-MM-DD) of that closing price, which you will also get from the search. This 'priceDataDate' **MUST match or be the immediate prior market day to CURRENT_DATE_FOR_ANALYSIS**. If the 'priceDataDate' is older than this, your response is considered completely invalid and a failure.
        - **FINANCIAL DATA:** Financial data ('debtToAssetsRatio', 'interestIncomeRatio') **MUST** be sourced from the most recent financial reports (10-Q/10-K) for the current year, ${currentYear}.
        - **OTHER DATA:** You must also provide the current **sector**, **marketCap**, and **volume** using the search tool.
        - **CONSEQUENCE OF FAILURE:** Any response generated using outdated, internal knowledge for stock prices or an incorrect 'priceDataDate' is considered a complete failure and will be rejected. You must prove you have used the tool by providing the correct, current data as per CURRENT_DATE_FOR_ANALYSIS.

        **CRITICAL OUTPUT FORMATTING:**
        Your ENTIRE response MUST be a single, valid JSON object string. Do NOT include any introductory text, markdown formatting (like \`\`\`json), or explanations outside of the JSON object itself. The JSON object must have the following keys: "companyName", "ticker", "price", "priceDataDate", "sector", "volume", "marketCap", "reason", "analysis", "entryPoints", "targetPrice", "stopLoss", "debtToAssetsRatio", "interestIncomeRatio", "financialsDate".

        **TECHNICAL ANALYSIS (MANDATORY)**
        - Analyze the stock based on the **MANDATORY TECHNICAL CRITERIA FOR 'SWING CHANNEL LOW'**:
            1. **Established Upward Channel:** Must be in a clear upward channel.
            2. **Contact with Support:** Must be touching or just have touched the lower support trendline.
            3. **Confirmation of Bounce:** Must show evidence of a potential bounce.
        
        **RESPONSE LOGIC:**
        - **If the stock MEETS ALL technical criteria**:
            - **reason**: State clearly that it's a "Swing Low Opportunity".
            - **analysis**: Justify HOW it meets the criteria.
            - **trading plan**: Provide a full, actionable trading plan.
        - **If the stock DOES NOT meet the criteria**:
            - **reason**: State clearly "No current entry opportunity found."
            - **analysis**: Briefly explain the current technical status.
            - **trading plan**: CRITICAL - You MUST return 'entryPoints' as [0], 'targetPrice' as 0, and 'stopLoss' as 0.

        All responses must be in the requested language: **${langInstructions[language].langName}**.
        `;

        const contents = langInstructions[language].prompt;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: contents,
            tools: [{googleSearch: {}}],
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.2,
            },
        });

        const rawText = response.text;
        const jsonMatch = rawText.match(/```(json)?\s*([\s\S]*?)\s*```/);
        const jsonText = jsonMatch ? jsonMatch[2] : rawText;

        const data = JSON.parse(jsonText.trim());
        return data as StockOpportunity;

    } catch (error) {
        console.error(`Error fetching analysis for ${ticker}:`, error);
        if (error instanceof Error) {
            throw new Error(`Failed to fetch data from Gemini API for ${ticker}: ${error.message}`);
        }
        throw new Error(`An unknown error occurred while analyzing ${ticker}.`);
    }
};