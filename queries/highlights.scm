(tag_name) @tag
; (erroneous_end_tag_name) @tag.error
; (doctype) @constant
(attribute_name) @attribute
(quoted_attribute_value) @string
(attribute_value) @string
(extends_statement(path) @string)
(include_statement(path) @string)
(comment) @comment

[
  "<"
  ">"
  "</"
  "/>"
  "{{"
  "}}"
  "{%"
  "%}"
] @punctuation.bracket
