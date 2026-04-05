import { useState, useCallback, useMemo } from "react";
import type { RefObject } from "react";
import { Sender } from "@ant-design/x";
import BottomSheet, { type BottomSheetRef } from "@wldyslw/react-bottom-sheet";
import {
  streamChatOllama,
  type OllamaMessage,
  type OllamaStreamChunk,
} from "@/lib/ollama";
import { type ParkingLot, type UnfinishedParkingRecord } from "@/lib/api";

interface AIChatSheetProps {
  sheetRef: RefObject<BottomSheetRef | null>;
  parkingLots: ParkingLot[];
  unfinishedRecords: UnfinishedParkingRecord[];
  onSelect: (lot: ParkingLot) => void;
}

export interface AIChatSheetRef {
  open: () => void;
}

const OLLAMA_MODEL = "qwen3.5:9b";
const INITIAL_PROMPT =
  "你好！我是小哲同学，可以帮你选择附近最合适的停车场。请问有什么可以帮你的？";

function buildSystemPrompt(
  parkingLots: ParkingLot[],
  unfinishedRecords: UnfinishedParkingRecord[],
) {
  return `你的名字叫做小哲同学，你的作用是帮助用户解决停车相关问题。
你需要基于停车场的信息和用户的预约信息，帮助用户寻找最合适的停车场。

## 停车场信息
以下是附近所有停车场的详细信息（格式：名称 | 地址 | 距离）：
${parkingLots.map((p) => `- ${p.parking_lot_name} | ${p.address} | ${typeof p.km === "number" ? p.km.toFixed(2) : p.km}km`).join("\n")}

## 用户预约信息
${unfinishedRecords.length > 0 ? JSON.stringify(unfinishedRecords, null, 2) : "暂无未完成的预约记录"}

---

## 分析规则
1. **最近的停车场**：选择距离（km）最小的停车场
2. **最适合的停车场**：综合考虑以下因素：
   - 距离是否在合理范围内（优先考虑3km以内）
   - 是否有未完成的预约记录（如果用户在某个停车场有预约，优先推荐该停车场）
   - 地址是否在用户可能去的区域（根据地址判断）
3. 如果用户没有明确要求"最近"，默认推荐"最适合"的停车场

## 输出格式
你需要按照以下格式输出：
1. 首先在 <think></think> 标签内进行思考分析
2. 然后在 <parking_lot_name></parking_lot_name> 标签内输出停车场名称

### 示例1：用户要求最近的停车场
输入：帮我找一个最近的停车场
输出：
<think>
用户要求最近的停车场。查看所有停车场的距离：
- 融兴购物商场停车场：1.2km
- 万象城停车场：2.5km
- 中心公园停车场：0.8km
最近的是中心公园停车场（0.8km）
</think>
<parking_lot_name>中心公园停车场</parking_lot_name>

### 示例2：用户要求适合的停车场
输入：帮我选择一个适合我的停车场
输出：
<think>
用户要求适合的停车场，需要综合考虑。
用户预约信息显示在"融兴购物商场停车场"有未完成的预约。
虽然"中心公园停车场"距离更近（0.8km），但用户在"融兴购物商场停车场"有预约，距离也在合理范围内（1.2km），推荐用户去完成预约。
</think>
<parking_lot_name>融兴购物商场停车场</parking_lot_name>

记住：
- 必须同时输出 <think> 和 <parking_lot_name> 两个标签
- <think> 中要清晰说明你的分析过程
- <parking_lot_name> 中只包含停车场名称，不要有其他内容
`;
}

type MessageItem = {
  key: string;
  role: "ai" | "user";
  content: string;
  thinking?: string; // AI 的思考过程
  status?: "loading" | "success" | "error";
};

// 解析消息内容，提取思考过程和停车场名称
function parseAIResponse(content: string): {
  text: string;
  thinkContent: string | null;
  parkingLotName: string | null;
} {
  const thinkRegex = /<think>([\s\S]*?)<\/think>/;
  const parkingLotRegex = /<parking_lot_name>(.*?)<\/parking_lot_name>/;

  const thinkMatch = content.match(thinkRegex);
  const parkingLotMatch = content.match(parkingLotRegex);

  let remainingText = content;

  // 移除 think 和 parking_lot_name 标签，保留其他文本
  if (thinkMatch) {
    remainingText = remainingText.replace(thinkRegex, "");
  }
  if (parkingLotMatch) {
    remainingText = remainingText.replace(parkingLotRegex, "");
  }

  return {
    text: remainingText.trim(),
    thinkContent: thinkMatch ? thinkMatch[1].trim() : null,
    parkingLotName: parkingLotMatch ? parkingLotMatch[1].trim() : null,
  };
}

export default function AIChatSheet(props: AIChatSheetProps) {
  const { parkingLots, unfinishedRecords, onSelect } = props;

  const [messages, setMessages] = useState<MessageItem[]>([
    {
      key: "init",
      role: "ai",
      content: INITIAL_PROMPT,
      status: "success",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const systemPrompt = useMemo(
    () => buildSystemPrompt(parkingLots, unfinishedRecords),
    [parkingLots, unfinishedRecords],
  );

  const handleSubmit = useCallback(
    async (value: string) => {
      if (!value.trim() || isLoading) return;

      const userMsg: MessageItem = {
        key: `user_${Date.now()}`,
        role: "user",
        content: value.trim(),
        status: "success",
      };

      const aiMsgKey = `ai_${Date.now()}`;
      const aiMsg: MessageItem = {
        key: aiMsgKey,
        role: "ai",
        content: "",
        status: "loading",
      };

      setMessages((prev) => [...prev, userMsg, aiMsg]);
      setIsLoading(true);
      setInputValue(""); // 清空输入框

      try {
        // 构建历史消息（排除初始欢迎语）
        const history: OllamaMessage[] = [
          { role: "system", content: systemPrompt },
          ...messages
            .filter((m) => m.key !== "init")
            .map((m) => ({
              role:
                m.role === "ai" ? ("assistant" as const) : ("user" as const),
              content: m.content,
            })),
          { role: "user", content: value.trim() },
        ];

        let fullContent = "";
        let fullThinking = "";

        for await (const chunk of streamChatOllama({
          model: OLLAMA_MODEL,
          messages: history,
        })) {
          if (chunk.content) {
            fullContent += chunk.content;
          }
          if (chunk.thinking) {
            fullThinking += chunk.thinking;
          }

          setMessages((prev) =>
            prev.map((m) =>
              m.key === aiMsgKey
                ? {
                    ...m,
                    content: fullContent,
                    thinking: fullThinking || undefined,
                    status: "loading" as const,
                  }
                : m,
            ),
          );
        }

        // 标记完成
        setMessages((prev) =>
          prev.map((m) =>
            m.key === aiMsgKey ? { ...m, status: "success" as const } : m,
          ),
        );
      } catch (error) {
        console.error("AI 对话失败:", error);
        setMessages((prev) =>
          prev.map((m) =>
            m.key === aiMsgKey
              ? {
                  ...m,
                  content: "抱歉，我遇到了一些问题，请稍后再试。",
                  status: "error" as const,
                }
              : m,
          ),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [messages, systemPrompt, parkingLots, onSelect, isLoading],
  );

  // 处理停车场卡片点击
  const handleParkingLotClick = useCallback(
    (lotName: string) => {
      const matched = parkingLots.find(
        (lot) => lot.parking_lot_name === lotName,
      );
      if (matched) {
        onSelect(matched);
      }
    },
    [parkingLots, onSelect],
  );

  return (
    <BottomSheet
      ref={props.sheetRef}
      className="px-3 shadow-2xl"
      detents={["90%"]}
      grabberVisible
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center gap-3 px-2 py-3 border-b border-border shrink-0">
          <img
            src="/images/ai-man.png"
            alt="小哲"
            className="w-10 h-10 rounded-full"
          />
          <div>
            <div className="font-bold text-sm">小哲同学</div>
            <div className="text-xs text-muted-foreground">AI 停车场助手</div>
          </div>
          {isLoading && (
            <span className="ml-auto text-xs text-muted-foreground animate-pulse">
              回复中...
            </span>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-3">
          {messages.map((m) => {
            const isUser = m.role === "user";
            const parsed = parseAIResponse(m.content);

            return (
              <div
                key={m.key}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg ${
                    isUser ? "bg-primary text-primary-foreground px-3 py-2" : ""
                  }`}
                >
                  {isUser ? (
                    <div className="text-sm">{m.content}</div>
                  ) : (
                    <div className="flex flex-col gap-2 w-full">
                      {/* 思考过程（从 Ollama 的 thinking 字段） */}
                      {m.thinking && (
                        <div className="bg-muted/50 border-l-2 border-primary/30 rounded px-3 py-2 text-xs text-muted-foreground">
                          <div className="font-medium mb-1 flex items-center gap-1">
                            <span>💭</span>
                            <span>思考过程</span>
                          </div>
                          <div className="whitespace-pre-wrap">
                            {m.thinking}
                          </div>
                        </div>
                      )}

                      {/* 其他文本内容 */}
                      {parsed.text && (
                        <div className="text-sm">{parsed.text}</div>
                      )}

                      {/* 停车场卡片 */}
                      {parsed.parkingLotName &&
                        (() => {
                          const parkingLot = parkingLots.find(
                            (lot) =>
                              lot.parking_lot_name === parsed.parkingLotName,
                          );
                          return parkingLot ? (
                            <div
                              onClick={() =>
                                handleParkingLotClick(parsed.parkingLotName!)
                              }
                              className="border border-border rounded-lg p-3 bg-card w-full cursor-pointer transition-colors shadow-sm hover:shadow-md"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-sm mb-1 flex items-center gap-2">
                                    <span className="text-primary">📍</span>
                                    {parkingLot.parking_lot_name}
                                  </div>
                                  <div className="text-xs text-muted-foreground line-clamp-1">
                                    {parkingLot.address}
                                  </div>
                                  {parkingLot.km !== undefined && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                      距离:{" "}
                                      {typeof parkingLot.km === "number"
                                        ? parkingLot.km.toFixed(2)
                                        : parkingLot.km}{" "}
                                      km
                                    </div>
                                  )}
                                </div>
                                <div className="text-primary text-xs whitespace-nowrap flex items-center gap-1 mt-1">
                                  <span>导航</span>
                                  <span>→</span>
                                </div>
                              </div>
                            </div>
                          ) : null;
                        })()}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Sender */}
        <div className="border-border px-2 py-2 shrink-0 flex flex-col gap-2">
          <div className="flex gap-2">
            <div onClick={() => setInputValue("帮我选择一个适合我的停车场")} className="text-sm text-primary bg-primary/20 border border-primary rounded-full px-2 py-1">
              寻找最合适的停车场
            </div>
            <div onClick={() => setInputValue("帮我选择一个最近的停车场")} className="text-sm text-amber-500 bg-amber-500/20 border border-amber-500 rounded-full px-2 py-1">
              寻找最近的停车场
            </div>
          </div>
          <Sender
            value={inputValue}
            onChange={setInputValue}
            onSubmit={handleSubmit}
            loading={isLoading}
            disabled={isLoading}
            placeholder="请输入您的问题..."
          />
        </div>
      </div>
    </BottomSheet>
  );
}
