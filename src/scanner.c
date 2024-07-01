// #include "tree_sitter/alloc.h"
// #include "tree_sitter/array.h"
#include "tree_sitter/parser.h"
#include <stdint.h>

enum TokenType {
    EXPRESSION_CONTENT,
    STATEMENT_CONTENT,
    HTML_COMMENT,
    MACRO_ARGUMENT_END,
    HTML_CONTENT,
};

typedef struct {} Scanner;


u_int32_t strlen(const char *s) {
    u_int32_t len = 0;
    while (s[len]) {
        len++;
    }
    return len;
}

static bool scan_html_content(TSLexer *lexer) {
    lexer->mark_end(lexer);

    char closing_chars[] = {'<', '{', '%'};

    bool escaped = false;
    while (lexer->lookahead) {
        for (int i = 0; i < sizeof(closing_chars); i++) {
            char closing_char = closing_chars[i];
            if (lexer->lookahead == '\\') {
                escaped = !escaped;
            }
            if (lexer->lookahead == closing_char) {
                if (escaped) {
                    escaped = false;
                } else {
                    lexer->result_symbol = HTML_CONTENT;
                    return true;
                }
            }
        }
        lexer->advance(lexer, false);
    }

    return true;
}

static bool scan_until_sequence(TSLexer *lexer, char *closing_sequence) {
    lexer->mark_end(lexer);

    unsigned matched = 0;
    while (lexer->lookahead) {
        if (lexer->lookahead == closing_sequence[matched]) {
            if (++matched >= strlen(closing_sequence)) {
                break;
            }
            lexer->advance(lexer, false);
        } else {
            matched = 0;
            lexer->advance(lexer, false);
            lexer->mark_end(lexer);
        }
    }

    return true;
}

static void skip_whitespace(TSLexer *lexer) {
    while (lexer->lookahead == ' ' && lexer->lookahead == '\n') {
        lexer->advance(lexer, false);
    }
}

// static bool scan_macro_argument_end(TSLexer *lexer) {
//     while (lexer->lookahead) {
//         if (lexer->lookahead == ',') {
//            lexer->mark_end(lexer);
//            lexer->advance(lexer, false);
//            // skip_whitespace(lexer);
//            break;
//         }
//         if (lexer->lookahead == ')') {
//            lexer->mark_end(lexer);
//            lexer->advance(lexer, false);
//            // skip_whitespace(lexer);
//            break;
//         }
//     }
//
//     lexer->result_symbol = MACRO_ARGUMENT_END;
//     return true;
// }

/// https://github.com/tree-sitter/tree-sitter-html/blob/e4d834eb4918df01dcad5c27d1b15d56e3bd94cd/src/scanner.c#L112
static bool scan_comment(TSLexer *lexer) {
    if (lexer->lookahead != '-') {
        return false;
    }
    lexer->advance(lexer, false);

    if (lexer->lookahead != '-') {
        return false;
    }
    lexer->advance(lexer, false);

    unsigned dashes = 0;
    while (lexer->lookahead) {
        switch (lexer->lookahead) {
            case '-':
                ++dashes;
                break;
            case '>':
                if (dashes >= 2) {
                    lexer->result_symbol = HTML_COMMENT;
                    lexer->advance(lexer, false);
                    lexer->mark_end(lexer);
                    return true;
                }
            default:
                dashes = 0;
        }
        lexer->advance(lexer, false);
    }
    return false;
}

bool tree_sitter_htmlaskama_external_scanner_scan(
    void *payload,
    TSLexer *lexer,
    const bool *valid_symbols
) {
    if (valid_symbols[HTML_COMMENT] && scan_comment(lexer)){
        return true;
    }
    if (valid_symbols[HTML_CONTENT] && scan_html_content(lexer)){
        return true;
    }
    if (valid_symbols[MACRO_ARGUMENT_END] && (scan_until_sequence(lexer, ",")||scan_until_sequence(lexer, ")"))){
        lexer->result_symbol = MACRO_ARGUMENT_END;
        skip_whitespace(lexer);
        return true;
    }
    if (valid_symbols[STATEMENT_CONTENT] && scan_until_sequence(lexer, "%}")) {
        lexer->result_symbol = STATEMENT_CONTENT;
        return true;
    }
    if (valid_symbols[EXPRESSION_CONTENT] && scan_until_sequence(lexer, "}}")) {
        lexer->result_symbol = EXPRESSION_CONTENT;
        return true;
    }
    return false;
}

// If we need to allocate/deallocate state, we do it in these functions.
void *tree_sitter_htmlaskama_external_scanner_create() { return NULL; }

void tree_sitter_htmlaskama_external_scanner_destroy(void *payload) {}

// If we have state, we should load and save it in these functions.
unsigned tree_sitter_htmlaskama_external_scanner_serialize(void *payload, char *buffer) {
    return 0;
}

void tree_sitter_htmlaskama_external_scanner_deserialize(void *payload, char *buffer, unsigned length) {}
