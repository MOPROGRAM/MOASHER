import { GoogleGenAI, Type } from "@google/genai";
import type { StockOpportunity } from '../types';

export type PriceRange = 'all' | '0-5' | '5-10' | '10-20' | '20-50' | '50-100' | '100-200' | '200+';

const getPriceRangeConstraint = (priceRange: PriceRange, language: 'ar' | 'en') => {
    if (priceRange === 'all') {
        return {
            ar: "",
            en: ""
        };
    }

    const priceMap: { [key in PriceRange]: { ar: string, en: string } } = {
        '0-5': { ar: "نقطة الدخول تتراوح بين 0 و 5 دولارات.", en: "entry points are strictly between $0 and $5." },
        '5-10': { ar: "نقطة الدخول تتراوح بين 5 و 10 دولارات.", en: "entry points are strictly between $5 and $10." },
        '10-20': { ar: "نقطة الدخول تتراوح بين 10 و 20 دولارًا.", en: "entry points are strictly between $10 and $20." },
        '20-50': { ar: "نقطة الدخول تتراوح بين 20 و 50 دولارًا.", en: "entry points are strictly between $20 and $50." },
        '50-100': { ar: "نقطة الدخول تتراوح بين 50 و 100 دولار.", en: "entry points are strictly between $50 and $100." },
        '100-200': { ar: "نقطة الدخول تتراوح بين 100 و 200 دولار.", en: "entry points are strictly between $100 and $200." },
        '200+': { ar: "نقطة الدخول تزيد عن 200 دولار.", en: "entry points are strictly above $200." },
        'all': { ar: "", en: "" }
    };

    return priceMap[priceRange];
};

export const fetchStockOpportunities = async (language: 'ar' | 'en', priceRange: PriceRange = 'all', signal?: AbortSignal): Promise<StockOpportunity[]> => {
  let rawText: string;
  let data: StockOpportunity[];
  
  try {
    const API_KEY = process.env.API_KEY;
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    const today = new Date().toISOString().split('T')[0];
    const priceConstraint = getPriceRangeConstraint(priceRange, language);

    const langInstructions = {
        ar: {
            langName: "Arabic (العربية الفصحى)",
            prompt: [
                `أنت خبير أسواق مالية ومحلل فني.`,
                `المطلوب: تحليل السوق وتحديد أفضل 10 فرص (حد أقصى) لأسهم أمريكية للشراء اليوم (${today}) بناءً على التحليل الفني.`,
                `معايير البحث: ابحث عن الأسهم التي تشكل "قاع سوينج" (Swing Low)، أو ترتد من مناطق دعم قوية، أو تظهر نماذج استمرارية إيجابية.`,
                `مهم: إذا لم تتوفر فرص "قاع سوينج" مثالية، يرجى اختيار الأسهم التي تظهر أفضل إعدادات فنية قريبة من الدعم (Best Available Setups). لا ترجع قائمة فارغة.`,
                `يجب أن يقدم كل سهم خطة تداول متكاملة (نطاق دخول، هدف، وقف خسارة).`,
                priceConstraint.ar ? `شرط إضافي: ${priceConstraint.ar}` : '',
                `فلترة: تجنب الأسهم غير المتوافقة شرعياً (مثل البنوك والخمور) قدر الإمكان.`,
                `تنسيق: المخرجات يجب أن تكون مصفوفة JSON فقط.`
            ].filter(Boolean).join(' ')
        },
        en: {
            langName: "English",
            prompt: [
                `You are a financial market expert and technical analyst.`,
                `Task: Analyze the market and identify the top 10 (maximum) US stock buying opportunities for today (${today}) based on technical analysis.`,
                `Criteria: Look for stocks at "Swing Lows", bouncing from strong support, or showing positive continuation patterns.`,
                `Important: If perfect "Swing Low" setups are scarce, strictly select the "Best Available Setups" approaching support. Do NOT return an empty list.`,
                `Each stock must include a complete trading plan (entry range, target, stop loss).`,
                priceConstraint.en ? `Additional Constraint: ${priceConstraint.en}` : '',
                `Filter: Avoid ethically non-compliant stocks (e.g., banks, alcohol) where possible.`,
                `Format: Output must be a JSON array only.`
            ].filter(Boolean).join(' ')
        }
    }

    const systemInstruction = [
        `You are an expert technical analyst specializing in US stocks.`,
        `Your goal is to generate a list of actionable trading opportunities for ${today}.`,
        `Use your knowledge of chart patterns, market structure, and price action.`,
        `Do NOT refuse to answer due to lack of real-time data. Use the most recent market data you have to identify valid technical setups (e.g., support retests, channel bottoms).`,
        `Output strictly a JSON array. No markdown formatting.`,
    ].join('\n');

    const contents = { parts: [{ text: langInstructions[language].prompt }] };
    
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: contents,
      signal: signal,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.4, // Slightly increased to ensure results are found even in choppy markets
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              companyName: { type: Type.STRING, description: 'The name of the company.' },
              ticker: { type: Type.STRING, description: 'The stock ticker symbol.' },
              exchange: { type: Type.STRING, description: 'The exchange (e.g., NASDAQ, NYSE).' },
              reason: { type: Type.STRING, description: 'Brief technical reason (e.g., "Bounce off 200 MA").' },
              analysis: { type: Type.STRING, description: 'Detailed analysis of the setup.' },
              entryPoints: {
                type: Type.ARRAY,
                items: { type: Type.NUMBER },
                description: 'Suggested entry prices.'
              },
              stopLoss: { type: Type.NUMBER, description: 'Stop loss price.' },
              targetPrice: { type: Type.NUMBER, description: 'Target price.' }
            },
            required: ["companyName", "ticker", "reason", "analysis", "entryPoints", "stopLoss", "targetPrice"]
          }
        }
      }
    });

    rawText = response.text;
    try {
        data = JSON.parse(rawText.trim()) as StockOpportunity[];
    } catch (parseError) {
        console.error("Failed to parse JSON from Gemini API in fetchStockOpportunities.", { rawText, parseError });
        if (parseError instanceof SyntaxError) {
            throw new Error(`Failed to parse response: Invalid JSON syntax. Raw: ${rawText.substring(0, 100)}...`);
        }
        throw new Error(`Failed to parse response from Gemini.`);
    }
    
    const augmentedData = data.map(stock => ({
        ...stock,
        exchange: stock.exchange || null,
        price: null,
        sector: null,
        volume: null,
        marketCap: null,
        debtToAssetsRatio: null,
        interestIncomeRatio: null,
        financialsDate: null,
        priceDataDate: null,
        entryPoints: Array.isArray(stock.entryPoints) ? stock.entryPoints.map(point => parseFloat(String(point))) : [],
        stopLoss: parseFloat(String(stock.stopLoss)),
        targetPrice: parseFloat(String(stock.targetPrice)),
    }));
    return augmentedData;

  } catch (error: any) {
    console.error("Error fetching stock opportunities:", error);
    if (error.name === 'AbortError') {
        throw error;
    }
    if (error instanceof Error) {
        throw new Error(`Failed to fetch data: ${error.message}`);
    }
    throw new Error("An unknown error occurred while contacting the API.");
  }
};


export const fetchSingleStockAnalysis = async (ticker: string, language: 'ar' | 'en', signal?: AbortSignal): Promise<StockOpportunity> => {
    let rawText: string;
    let data: StockOpportunity;

    try {
      const API_KEY = process.env.API_KEY;
      const ai = new GoogleGenAI({ apiKey: API_KEY });

        const today = new Date().toISOString().split('T')[0];
        const langInstructions = {
            ar: {
                langName: "Arabic (العربية الفصحى)",
                prompt: [
                    `الرجاء تحليل السهم الأمريكي برمز '${ticker}' لليوم بتاريخ ${today}.`,
                    `هل يمثل فرصة "قاع سوينج" أو فرصة شراء فنية جيدة؟`,
                    `إذا كانت هناك فرصة دخول حالية، قدم خطة تداول كاملة.`,
                    `إذا لم تكن هناك فرصة، وضح ذلك في التحليل وأعد قيم الخطة (نقاط الدخول، الهدف، الوقف) كأصفار.`
                ].join(' ')
            },
            en: {
                langName: "English",
                prompt: [
                    `Please analyze the US stock with ticker '${ticker}' for today, ${today}.`,
                    `Does it represent a 'Swing Channel Low' or a good technical buying opportunity?`,
                    `If a current entry opportunity exists, provide a full trading plan.`,
                    `If no opportunity exists, state that clearly and return the trading plan values (entry points, target, stop loss) as zeros.`
                ].join(' ')
            }
        };

        const systemInstruction = [
            `You are an expert technical analyst for the US stock market.`,
            `Task: Analyze the stock '${ticker}' for ${today}.`,
            `Output: A JSON object containing the analysis and trading plan.`,
            `If the stock is a good buy (Swing Low, Support, Breakout), provide entryPoints, stopLoss, and targetPrice.`,
            `If NOT a buy, set entryPoints to [0], stopLoss to 0, and targetPrice to 0.`,
            `Format: JSON object only. No markdown.`,
        ].join('\n');

        const contents = { parts: [{ text: langInstructions[language].prompt }] };

        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: contents,
            signal: signal,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.2,
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    companyName: { type: Type.STRING },
                    ticker: { type: Type.STRING },
                    exchange: { type: Type.STRING },
                    reason: { type: Type.STRING },
                    analysis: { type: Type.STRING },
                    entryPoints: {
                      type: Type.ARRAY,
                      items: { type: Type.NUMBER },
                      description: 'Suggested entry prices, or [0] if no opportunity.'
                    },
                    stopLoss: { type: Type.NUMBER, description: 'Suggested stop-loss price, or 0.' },
                    targetPrice: { type: Type.NUMBER, description: 'Suggested target price, or 0.' }
                  },
                  required: ["companyName", "ticker", "reason", "analysis", "entryPoints", "stopLoss", "targetPrice"]
                }
            }
        });

        rawText = response.text;
        try {
            data = JSON.parse(rawText.trim()) as StockOpportunity;
        } catch (parseError) {
            console.error("Failed to parse JSON from Gemini API in fetchSingleStockAnalysis.", { rawText, parseError });
            if (parseError instanceof SyntaxError) {
                throw new Error(`Failed to parse response: Invalid JSON syntax.`);
            }
            throw new Error(`Failed to parse response.`);
        }
        
        const augmentedData: StockOpportunity = {
            ...data,
            exchange: data.exchange || null,
            price: null,
            sector: null,
            volume: null,
            marketCap: null,
            debtToAssetsRatio: null,
            interestIncomeRatio: null,
            financialsDate: null,
            priceDataDate: null,
            entryPoints: Array.isArray(data.entryPoints) ? data.entryPoints.map(point => parseFloat(String(point))) : [],
            stopLoss: parseFloat(String(data.stopLoss)),
            targetPrice: parseFloat(String(data.targetPrice)),
        };

        return augmentedData;

    } catch (error: any) {
        console.error(`Error fetching analysis for ${ticker}:`, error);
        if (error.name === 'AbortError') {
            throw error;
        }
        if (error instanceof Error) {
            throw new Error(`Failed to analyze ${ticker}: ${error.message}`);
        }
        throw new Error(`An unknown error occurred while analyzing ${ticker}.`);
    }
};