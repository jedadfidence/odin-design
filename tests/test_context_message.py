from odin.graph import _build_context_message


class TestBuildContextMessage:
    def test_returns_none_for_empty_context(self):
        assert _build_context_message(None) is None
        assert _build_context_message({}) is None

    def test_countries_and_platforms(self):
        msg = _build_context_message({"countries": ["Poland"], "platforms": ["Meta"]})
        assert msg is not None
        assert "Poland" in msg.content
        assert "Meta" in msg.content

    def test_selected_text_single(self):
        msg = _build_context_message({"selected_text": ["CPR 3.2 increased by 15%"]})
        assert msg is not None
        assert "CPR 3.2 increased by 15%" in msg.content
        assert "referring to" in msg.content.lower()

    def test_selected_text_multiple(self):
        msg = _build_context_message({
            "selected_text": ["First quote", "Second quote"],
        })
        assert msg is not None
        assert "First quote" in msg.content
        assert "Second quote" in msg.content

    def test_selected_text_with_countries(self):
        msg = _build_context_message({
            "countries": ["Poland"],
            "selected_text": ["CPR went up"],
        })
        assert msg is not None
        assert "Poland" in msg.content
        assert "CPR went up" in msg.content

    def test_only_selected_text_no_filters(self):
        """selected_text alone should still produce a message (no countries/platforms needed)."""
        msg = _build_context_message({"selected_text": ["some text"]})
        assert msg is not None
