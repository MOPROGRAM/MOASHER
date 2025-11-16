import { GoogleGenAI, Type } from "@google/genai";
import type { StockOpportunity } from '../types';
// Alpha Vantage service is no longer used for numerical data points.
// import { fetchFundamentalData } from "./alphaVantageService"; 

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });
const currentYear = new Date().getFullYear(); // Keep for context in instructions, but not used for data

export const fetchStockOpportunities = async (language: 'ar' | 'en'): Promise<StockOpportunity[]> => {
  let rawText: string;
  let data: StockOpportunity[];
  try {
    const today = new Date().toISOString().split('T')[0];
    const langInstructions = {
        ar: {
            langName: "Arabic (العربية الفصحى)",
            prompt: `الرجاء تزويدي بقائمة من 100 سهم أمريكي تمثل فرص شراء قوية عند قاع السوينج لليوم بتاريخ ${today}. يجب أن يقدم كل سهم خطة تداول متكاملة (نقاط دخول، هدف، وقف خسارة). ركز فقط على تحديد فرص قاع السوينج الواضحة. إذا لم يكن السهم في قاع سوينج واضح، فلا تضمنه في القائمة.`
        },
        en: {
            langName: "English",
            prompt: `Please provide me with a list of 100 US stocks that represent strong buying opportunities at a Swing Channel Low for today, ${today}. Each stock must include a complete trading plan (entry points, target, stop loss). Focus strictly on identifying clear Swing Channel Low opportunities. If a stock is not at a clear swing low, do not include it in the list.`
        }
    }

    // Fix: Combine multiple template literals into a single one to avoid parsing errors
    const systemInstruction = `
You are an expert technical analyst in the US stock market, specializing in swing and trend strategies.
Your analysis is based on interpreting technical charts, similar to how one would analyze TradingView charts.
Your task is to identify 100 US stocks with strong entry opportunities for today, ${today}, based on advanced technical analysis.

CURRENT_DATE_FOR_ANALYSIS: ${today}

**MANDATORY CRITERIA FOR IDENTIFYING 'SWING CHANNEL LOW' OPPORTUNITIES:**
1.  **Established Upward Channel:** The stock MUST be in a clearly defined upward-trending channel.
2.  **Contact with Support:** The stock's price action MUST be touching or have just touched the lower support trendline.
3.  **Confirmation of Bounce:** There MUST be technical evidence of a potential bounce or reversal from the support line.
4.  **Focus:** Only include stocks that meet ALL of these criteria for a clear 'Swing Channel Low' opportunity.

**MANDATORY SHARIA COMPLIANCE AND ETHICAL FILTERING:**
-   **Exclude Banks:** Do NOT include any banking institutions or financial services companies that primarily deal with interest.
-   **Exclude Alcohol/Gambling:** Do NOT include companies whose primary business involves alcohol production/distribution or gambling.
-   **Exclude Interest-Based Lending (Riba):** Do NOT include companies that engage in significant interest-based lending to individuals or corporations.
-   **Exclude Media Companies:** Do NOT include companies primarily engaged in media, entertainment, or publishing.
-   **Exclude War Industries:** Do NOT include companies involved in defense, weapons manufacturing, or military contracting.
-   **Exclude Israeli Companies:** Do NOT include any companies based in or significantly operating from Israel.

**OUTPUT DIRECTIVES (CRITICAL - NO NUMERICAL DATA FROM GEMINI):**
- **NO EXTERNAL DATA:** You are **STRICTLY FORBIDDEN** from providing any numerical stock data such as 'price', 'volume', 'marketCap', 'sector', 'debtToAssetsRatio', 'interestIncomeRatio', 'financialsDate', or 'priceDataDate'.
- **PURELY ANALYTICAL OUTPUT:** Your output is purely analytical and textual. Your internal model knowledge and analysis are the sole source for identifying opportunities and crafting the trading plan.
- **TRADING PLAN (MANDATORY IF OPPORTUNITY):** If a clear 'Swing Channel Low' opportunity is identified, you MUST provide a complete trading plan:
    - **entryPoints:** A list of suggested entry prices relevant to the identified swing low.
    - **targetPrice:** The suggested target price.
    - **stopLoss:** The suggested stop-loss price.
- **NO OPPORTUNITY HANDLING:** If a stock does NOT present a clear 'Swing Channel Low' opportunity based on your strict criteria, it MUST NOT be included in the list.

**CRITICAL OUTPUT FORMATTING:**
Your ENTIRE response MUST be a single, valid JSON array string. Do NOT include any introductory text, markdown formatting (like \`\`\`json), or explanations outside of the JSON array itself. The JSON must be an array of objects, where each object has the following keys: "companyName", "ticker", "reason", "analysis", "entryPoints", "targetPrice", "stopLoss".  All other fields are explicitly excluded.

All your responses, analysis, and company data must be in the requested language: **${langInstructions[language].langName}**. The data analysis must be current for today, ${today}.

`;

    // Use parts array for contents to ensure correct type handling
    const contents = { parts: [{ text: langInstructions[language].prompt }] };
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.2,
        // Add responseMimeType and responseSchema for structured JSON output
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              companyName: { type: Type.STRING, description: 'The name of the company.' },
              ticker: { type: Type.STRING, description: 'The stock ticker symbol.' },
              reason: { type: Type.STRING, description: 'The technical reason for the opportunity.' },
              analysis: { type: Type.STRING, description: 'Detailed technical analysis.' },
              entryPoints: {
                type: Type.ARRAY,
                items: { type: Type.NUMBER },
                description: 'Suggested entry prices.'
              },
              stopLoss: { type: Type.NUMBER, description: 'Suggested stop-loss price.' },
              targetPrice: { type: Type.NUMBER, description: 'Suggested target price.' }
            },
            required: ["companyName", "ticker", "reason", "analysis", "entryPoints", "stopLoss", "targetPrice"],
          },
        },
      },
    });

    // With responseMimeType and responseSchema, response.text should be a clean JSON string
    rawText = response.text; // Assign to rawText declared outside try block
    try {
        data = JSON.parse(rawText.trim()) as StockOpportunity[];
    } catch (parseError) {
        console.error("Failed to parse JSON from Gemini API in fetchStockOpportunities.", { rawText, parseError });
        if (parseError instanceof SyntaxError) {
            throw new Error(`Failed to parse response from Gemini: Invalid JSON syntax. Details: ${parseError.message}. Raw JSON: ${rawText.trim()}`);
        }
        throw new Error(`Failed to parse response from Gemini: An unknown parsing error occurred.`);
    }
    
    // Fill in omitted numerical fields with null/defaults as Gemini no longer provides them
    // And ensure numerical fields are parsed as numbers
    const augmentedData = data.map(stock => ({
        ...stock,
        price: null,
        sector: null,
        volume: null,
        marketCap: null,
        debtToAssetsRatio: null,
        interestIncomeRatio: null,
        financialsDate: null,
        priceDataDate: null,
        // Explicitly parse trading plan numbers to ensure correct type
        entryPoints: Array.isArray(stock.entryPoints) ? stock.entryPoints.map(point => parseFloat(String(point))) : [],
        stopLoss: parseFloat(String(stock.stopLoss)),
        targetPrice: parseFloat(String(stock.targetPrice)),
    }));
    return augmentedData;

  } catch (error) {
    console.error("Error fetching stock opportunities:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to fetch data from Gemini API: ${error.message}`);
    }
    throw new Error("An unknown error occurred while contacting the Gemini API.");
  }
};


export const fetchSingleStockAnalysis = async (ticker: string, language: 'ar' | 'en'): Promise<StockOpportunity> => {
    let rawText: string;
    let data: StockOpportunity;
    try {
        const today = new Date().toISOString().split('T')[0];
        const langInstructions = {
            ar: {
                langName: "Arabic (العربية الفصحى)",
                prompt: `الرجاء تحليل السهم الأمريكي برمز '${ticker}' لليوم بتاريخ ${today}. هل يمثل فرصة "قاع سوينج" حسب المعايير الفنية الإلزامية؟ إذا كانت هناك فرصة دخول حالية، قدم خطة تداول كاملة. إذا لم تكن هناك فرصة، وضح ذلك في التحليل وأعد قيم الخطdة (نقاط الدخول، الهدف، الوقف) كأصفار.`
            },
            en: {
                langName: "English",
                prompt: `Please analyze the US stock with ticker '${ticker}' for today, ${today}. Does it represent a 'Swing Channel Low' opportunity based on the mandatory technical criteria? If a current entry opportunity exists, provide a full trading plan. If no opportunity exists, state that clearly in the analysis and return the trading plan values (entry points, target, stop loss) as zeros.`
            }
        };

        // Fix: Combine multiple template literals into a single one to avoid parsing errors
        const systemInstruction = `
        You are an expert technical analyst for the US stock market.
        Your analysis is based on interpreting technical charts, similar to how one would analyze TradingView charts.
        Your task is to analyze a single stock provided by the user for today, ${today}.

        CURRENT_DATE_FOR_ANALYSIS: ${today}

        **MANDATORY CRITERIA FOR IDENTIFYING 'SWING CHANNEL LOW' OPPORTUNITIES:**
        1.  **Established Upward Channel:** The stock MUST be in a clearly defined upward-trending channel.
        2.  **Contact with Support:** The stock's price action MUST be touching or have just touched the lower support trendline.
        3.  **Confirmation of Bounce:** There MUST be technical evidence of a potential bounce or reversal from the support line.
        
        **MANDATORY SHARIA COMPLIANCE AND ETHICAL FILTERING:**
        -   **Exclude Banks:** Do NOT include any banking institutions or financial services companies that primarily deal with interest.
        -   **Exclude Alcohol/Gambling:** Do NOT include companies whose primary business involves alcohol production/distribution or gambling.
        -   **Exclude Interest-Based Lending (Riba):** Do NOT include companies that engage in significant interest-based lending to individuals or corporations.
        -   **Exclude Media Companies:** Do NOT include companies primarily engaged in media, entertainment, or publishing.
        -   **Exclude War Industries:** Do NOT include companies involved in defense, weapons manufacturing, or military contracting.
        -   **Exclude Israeli Companies:** Do NOT include any companies based in or significantly operating from Israel.

        **OUTPUT DIRECTIVES (CRITICAL - NO NUMERICAL DATA FROM GEMINI):**
        - **NO EXTERNAL DATA:** You are **STRICTLY FORBIDDEN** from providing any numerical stock data such as 'price', 'volume', 'marketCap', 'sector', 'debtToAssetsRatio', 'interestIncomeRatio', 'financialsDate', or 'priceDataDate'.
        - **PURELY ANALYTICAL OUTPUT:** Your output is purely analytical and textual. Your internal model knowledge and analysis are the sole source for identifying opportunities and crafting the trading plan.

        **CRITICAL OUTPUT FORMATTING:**
        Your ENTIRE response MUST be a single, valid JSON object string. Do NOT include any introductory text, markdown formatting (like \`\`\`json), or explanations outside of the JSON object itself. The JSON object must have the following keys: "companyName", "ticker", "reason", "analysis", "entryPoints", "targetPrice", "stopLoss".  All other fields are explicitly excluded.

        **RESPONSE LOGIC:**
        - **If the stock MEETS ALL technical criteria for a 'Swing Channel Low' opportunity**:
            - **reason**: State clearly that it's a "Swing Low Opportunity".
            - **analysis**: Justify HOW it meets the criteria.
            - **trading plan**: Provide a full, actionable trading plan.
        - **If the stock DOES NOT meet the criteria**:
            - **reason**: State clearly "No current entry opportunity found."
            - **analysis**: Briefly explain why it does not meet criteria or its current technical status.
            - **trading plan**: CRITICAL - You MUST return 'entryPoints' as [0], 'targetPrice' as 0, and 'stopLoss' as 0.

        All responses must be in the requested language: **${langInstructions[language].langName}**.
        
        `;

        // Use parts array for contents to ensure correct type handling
        const contents = { parts: [{ text: langInstructions[language].prompt }] };

        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: contents,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.2,
                // Add responseMimeType and responseSchema for structured JSON output
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    companyName: { type: Type.STRING, description: 'The name of the company.' },
                    ticker: { type: Type.STRING, description: 'The stock ticker symbol.' },
                    reason: { type: Type.STRING, description: 'The technical reason for the opportunity or lack thereof.' },
                    analysis: { type: Type.STRING, description: 'Detailed technical analysis.' },
                    entryPoints: {
                      type: Type.ARRAY,
                      items: { type: Type.NUMBER },
                      description: 'Suggested entry prices, or [0] if no opportunity.'
                    },
                    stopLoss: { type: Type.NUMBER, description: 'Suggested stop-loss price, or 0 if no opportunity.' },
                    targetPrice: { type: Type.NUMBER, description: 'Suggested target price, or 0 if no opportunity.' }
                  },
                  required: ["companyName", "ticker", "reason", "analysis", "entryPoints", "stopLoss", "targetPrice"],
                },
            },
        });

        // With responseMimeType and responseSchema, response.text should be a clean JSON string
        rawText = response.text; // Assign to rawText declared outside try block
        try {
            data = JSON.parse(rawText.trim()) as StockOpportunity;
        } catch (parseError) {
            console.error("Failed to parse JSON from Gemini API in fetchSingleStockAnalysis.", { rawText, parseError });
            if (parseError instanceof SyntaxError) {
                throw new Error(`Failed to parse response from Gemini: Invalid JSON syntax. Details: ${parseError.message}. Raw JSON: ${rawText.trim()}`);
            }
            throw new Error(`Failed to parse response from Gemini: An unknown parsing error occurred.`);
        }
        
        // Fill in omitted numerical fields with null/defaults as Gemini no longer provides them
        // And ensure numerical fields are parsed as numbers
        const augmentedData: StockOpportunity = {
            ...data,
            price: null,
            sector: null,
            volume: null,
            marketCap: null,
            debtToAssetsRatio: null,
            interestIncomeRatio: null,
            financialsDate: null,
            priceDataDate: null,
            // Explicitly parse trading plan numbers to ensure correct type
            entryPoints: Array.isArray(data.entryPoints) ? data.entryPoints.map(point => parseFloat(String(point))) : [],
            stopLoss: parseFloat(String(data.stopLoss)),
            targetPrice: parseFloat(String(data.targetPrice)),
        };
        
        // Alpha Vantage integration removed - financial data not fetched
        // const fundamentalData = await fetchFundamentalData(data.ticker);
        // if (fundamentalData) {
        //     augmentedData.debtToAssetsRatio = fundamentalData.debtToAssetsRatio;
        //     augmentedData.interestIncomeRatio = fundamentalData.interestIncomeRatio;
        //     augmentedData.financialsDate = fundamentalData.financialsDate;
        // } else {
        //     augmentedData.debtToAssetsRatio = null;
        //     augmentedData.interestIncomeRatio = null;
        //     augmentedData.financialsDate = null;
        // }

        return augmentedData;

    } catch (error) {
        console.error(`Error fetching analysis for ${ticker}:`, error);
        if (error instanceof Error) {
            throw new Error(`Failed to fetch data from Gemini API for ${ticker}: ${error.message}`);
        }
        throw new Error(`An unknown error occurred while analyzing ${ticker}.`);
    }
};