package tree_sitter_htmlaskama_test

import (
	"testing"

	tree_sitter "github.com/smacker/go-tree-sitter"
	"github.com/tree-sitter/tree-sitter-htmlaskama"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_htmlaskama.Language())
	if language == nil {
		t.Errorf("Error loading Htmlaskama grammar")
	}
}
