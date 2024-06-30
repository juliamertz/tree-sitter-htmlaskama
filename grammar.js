/// <reference types="tree-sitter-cli/dsl" />
// @ts-check
module.exports = grammar({
  name: "htmlaskama",

  externals: $ => [
    $._expression_content,
    $._statement_content,
    $._html_comment
  ],

  extras: () => [/\s+/],

  rules: {
    document: $ => repeat(choice($._node)),

    identifier: () => /\w+/,
    _tag_name: $ => alias($.identifier, $.tag_name),
    content: $ => alias($.identifier, $.content),
    string: () => /"[^"]*"/,

    _node: $ => choice($.element, $.expression, $.statement, $.content, $.html_comment),

    element: $ =>
      choice(
        seq($.start_tag, repeat($._node), $.end_tag),
        $.self_closing_tag
      ),

    start_tag: $ => seq("<", $._tag_name, repeat(choice($.attribute, $.statement)), ">"),
    end_tag: $ => seq("</", $._tag_name, ">"),
    self_closing_tag: $ => seq("<", $._tag_name, repeat(choice($.attribute, $.statement)), "/>"),

    html_comment: $ => alias(seq("<",$._html_comment), $.comment),

    attribute: $ =>
      seq(
        $.attribute_name,
        optional(
          seq("=", choice($.attribute_value, $.quoted_attribute_value)),
        ),
      ),

    attribute_name: () => /[^<>"'/=\s]+/,
    attribute_value: () => /[^<>"'=\s]+/,

    quoted_attribute_value: $ =>
      choice(
        seq("'", optional(alias(/[^']+/, $.attribute_value)), "'"),
        seq('"', optional(alias(/[^"]+/, $.attribute_value)), '"'),
      ),

    expression: $ =>
      seq(
        $.start_expression,
        alias($._expression_content, $.expression_content),
        $.end_expression,
      ),

    start_expression: () => seq("{{"),
    end_expression: () => seq("}}"),

    statement: ($) => choice($.unpaired_statement, $.paired_statement),
    unpaired_statement: ($) => choice($.extends_statement, $.include_statement),
    paired_statement: ($) =>
      choice(
        $.block_start_statement,
        prec.left($.if_statement),
        prec.left($.elif_statement),
        prec.left($.else_statement),
        prec.left($.endif_statement),
        prec.right($.block_end_statement),
      ),

    start_statement: () => seq("{%"),
    end_statement: () => seq("%}"),

    block_start_statement: ($) =>
      seq("{%", alias("block", $.tag_name), $.identifier, "%}"),

    block_end_statement: ($) => seq("{%", alias("endblock", $.tag_name), "%}"),

    include_statement: ($) =>
      seq("{%", alias("include", $.tag_name), alias($.string, $.path), "%}"),

    extends_statement: ($) =>
      seq("{%", alias("extends", $.tag_name), alias($.string, $.path), "%}"),

    // TODO: fix nesting statements and their content
    if_statement: ($) =>
      prec.left(
        seq(
          $.start_statement,
          alias("if", $.tag_name),
          alias($._statement_content, $.statement_content),
          $.end_statement,
          repeat($._node),
          // repeat(
          //   prec.left(
          //     seq(alias($.elif_statement, $.branch_statement), repeat($._node)),
          //   ),
          // ),
          // optional(
          //   seq(alias($.else_statement, $.branch_statement), repeat($._node)),
          // ),
        ),
      ),
    else_statement: ($) =>
      seq($.start_statement, alias("else", $.tag_name), $.end_statement),
    elif_statement: ($) =>
      seq(
        $.start_statement,
        alias("elif", $.tag_name),
        alias($._statement_content, $.statement_content),
        $.end_statement,
      ),
    endif_statement: ($) => seq("{%", alias("endif", $.tag_name), "%}"),
  },
});
