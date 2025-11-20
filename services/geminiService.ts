import { GoogleGenAI, Type, FunctionDeclaration, Modality } from "@google/genai";
import { Message, Attachment } from "../types";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to strip data URL prefix for Gemini API
const cleanBase64 = (dataUrl: string) => {
  const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (matches && matches.length === 3) {
    return matches[2]; // Return just the base64 string
  }
  return dataUrl; // Fallback if format doesn't match
};

// Define the image generation tool
const generateImageTool: FunctionDeclaration = {
  name: "generate_image",
  description: "Generate an image based on a user's description. Use this when the user explicitly asks to create, generate, or draw an image.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      prompt: {
        type: Type.STRING,
        description: "The detailed description of the image to generate.",
      },
    },
    required: ["prompt"],
  },
};

export const generateSpeech = async (text: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio data returned");
    
    return `data:audio/wav;base64,${base64Audio}`;
  } catch (error) {
    console.error("TTS Error:", error);
    throw error;
  }
};

export const sendMessageToGemini = async (
  history: Message[],
  newMessage: string,
  newAttachments: Attachment[] = []
): Promise<{ text: string; attachments: Attachment[] }> => {
  try {
    const model = 'gemini-2.5-flash';
    
    // Construct history for the context
    const chatHistory = history.map(msg => {
      const parts: any[] = [];
      
      // Add attachments if they exist in history
      if (msg.attachments && msg.attachments.length > 0) {
        msg.attachments.forEach(att => {
          parts.push({
            inlineData: {
              mimeType: att.mimeType,
              data: cleanBase64(att.content)
            }
          });
        });
      }
      
      // Add text
      if (msg.content) {
        parts.push({ text: msg.content });
      }

      return {
        role: msg.role,
        parts: parts
      };
    });

    const chat = ai.chats.create({
      model: model,
      history: chatHistory,
      config: {
        systemInstruction: "You are VAIRAM AI, a helpful, intelligent, and premium AI assistant. Keep your answers concise, professional, yet friendly. You can process images and audio provided by the user. If the user asks to generate an image, use the available tool.",
        tools: [{ functionDeclarations: [generateImageTool] }],
      }
    });

    // Prepare current message parts
    const currentParts: any[] = [];
    
    newAttachments.forEach(att => {
      currentParts.push({
        inlineData: {
          mimeType: att.mimeType,
          data: cleanBase64(att.content)
        }
      });
    });
    
    if (newMessage) {
      currentParts.push({ text: newMessage });
    }

    // Handle empty message (e.g. audio only)
    if (currentParts.length === 0) {
        throw new Error("Message cannot be empty");
    }

    const result = await chat.sendMessage({
      message: currentParts
    });

    let responseText = result.text || "";
    let generatedAttachments: Attachment[] = [];

    // Handle Function Calls
    const functionCalls = result.functionCalls;
    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];
      if (call.name === "generate_image") {
        const prompt = call.args['prompt'] as string;
        
        try {
          // Generate Image using Imagen 3 model
          const imageResponse = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/jpeg'
            }
          });
          
          if (imageResponse.generatedImages && imageResponse.generatedImages.length > 0) {
             const imageBytes = imageResponse.generatedImages[0].image.imageBytes;
             generatedAttachments.push({
               type: 'image',
               content: `data:image/jpeg;base64,${imageBytes}`,
               mimeType: 'image/jpeg',
               name: 'generated_image.jpg'
             });

             // Send tool response back to the model
             const funcResponse = await chat.sendMessage({
               message: [{
                 functionResponse: {
                   name: 'generate_image',
                   id: call.id,
                   response: { result: 'Image generated successfully.' }
                 }
               }]
             });
             
             responseText = funcResponse.text || "I have generated the image for you.";
          } else {
             responseText = "I tried to generate an image, but no image was returned.";
          }

        } catch (err) {
          console.error("Image Generation Error:", err);
          responseText = "I apologize, but I encountered an error while attempting to generate the image.";
        }
      }
    }

    // Fallback if no text and no attachments
    if (!responseText && generatedAttachments.length === 0) {
      responseText = "I processed your request but have no text response.";
    }

    return { text: responseText, attachments: generatedAttachments };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to get response from VAIRAM AI.");
  }
};