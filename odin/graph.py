from typing import Any

from langchain_core.messages import SystemMessage
from langgraph.graph import StateGraph, START, END
from langgraph.graph.state import CompiledStateGraph
from langchain.agents import AgentState
from odin.agent import build_agent


class OdinState(AgentState):
    context: dict[str, Any] | None


def _build_context_message(context: dict[str, Any] | None) -> SystemMessage | None:
    """Turn frontend context selections into a system message the LLM can see."""
    if not context:
        return None
    parts: list[str] = []
    if context.get("countries"):
        parts.append(f"Countries: {', '.join(context['countries'])}")
    if context.get("platforms"):
        parts.append(f"Platforms: {', '.join(context['platforms'])}")
    if context.get("selected_text"):
        parts.append(
            "The user is referring to the following text from the conversation:\n"
            + "\n---\n".join(f'"{t}"' for t in context["selected_text"])
        )
    if not parts:
        return None
    return SystemMessage(
        content=(
            "The user has selected the following context filters for this message. "
            "Focus your analysis on these selections:\n" + "\n".join(parts)
        )
    )


def build_graph() -> CompiledStateGraph:
    async def conversation_node(state: OdinState) -> dict:
        agent = build_agent()
        messages = list(state["messages"])
        ctx_msg = _build_context_message(state.get("context"))
        if ctx_msg:
            messages.append(ctx_msg)
        result = await agent.ainvoke({"messages": messages})
        return {"messages": result["messages"]}

    graph_builder = StateGraph(OdinState)
    graph_builder.add_node("chat_agent", conversation_node)
    graph_builder.add_edge(START, "chat_agent")
    graph_builder.add_edge("chat_agent", END)

    return graph_builder.compile()
