/// <reference types="tree-sitter-cli/dsl" />
// @ts-check
module.exports = grammar({
  name: "htmlaskama",

  externals: ($) => [
    $._expression_content,
    $._statement_content,
    $._html_comment,
    $._template_comment,
    $._macro_argument_end,
  ],

  extras: () => [/\s+/],

  rules: {
    document: ($) => repeat($._node),

    identifier: () => /\w+/,
    _tag_name: ($) => alias($.identifier, $.tag_name),
    content: ($) => alias($.identifier, $.content),
    string: () => /"[^"]*"/,
    // text: () => /[^<>&\s{%]([^<>&\s{%]*[^<>&\s{%])?/,
    text: ($) => $.content,

    _node: ($) =>
      choice(
        $.element,
        $.expression,
        $.statement,
        $.comment,
        alias($.identifier, $.text),
      ),

    operator: ($) => token(
      "="
    ),

    element: ($) =>
      choice(seq($.start_tag, repeat($._node), $.end_tag), $.self_closing_tag),

    start_tag: ($) =>
      seq("<", $._tag_name, repeat(choice($.attribute, $.statement)), ">"),
    end_tag: ($) => seq("</", $._tag_name, ">"),
    self_closing_tag: ($) =>
      seq("<", $._tag_name, repeat(choice($.attribute, $.statement)), "/>"),

    comment: ($) =>
      alias(
        choice(
          seq("{", $._template_comment),
          seq("<", $._html_comment),
        ),
        $.comment,
      ),

    attribute: ($) =>
      seq(
        $.attribute_name,
        optional(seq("=", choice($.attribute_value, $.quoted_attribute_value))),
      ),

    attribute_name: () => /[^<>"'/=\s]+/,
    attribute_value: () => /[^<>"'=\s]+/,

    quoted_attribute_value: ($) =>
      choice(
        seq("'", optional(alias(/[^']+/, $.attribute_value)), "'"),
        seq('"', optional(alias(/[^"]+/, $.attribute_value)), '"'),
      ),

    expression: ($) =>
      seq(
        $.start_expression,
        alias($._expression_content, $.expression_content),
        $.end_expression,
      ),

    start_expression: () => seq("{{"),
    end_expression: () => seq("}}"),

    statement: ($) => choice($.unpaired_statement, $.paired_statement),

    unpaired_statement: ($) =>
      choice(
        $.extends_statement,
        $.include_statement,
        $.import_statement,
        $.call_statement,
        // FIX: including let statment breaks all paired statements????
        // $.let_statement,
      ),

    paired_statement: ($) =>
      choice(
        $.macro_statement,
        $.block_statement,
        // $.block_start_statement,
        prec.left($.if_statement),
        // prec.left($.elif_statement),
        // prec.left($.else_statement),
        // prec.left($.endif_statement),
        // prec.right($.block_end_statement),
      ),

    let_statement: ($) =>
      seq(
        $.start_statement,
        alias(choice("let", "set"),$.keyword),
        $.identifier,
        $.operator,
        alias($._expression_content, $.expression_content),
        // alias($._statement_content, $.statement_content),
        $.end_expression,
      ),

    start_statement: () => seq("{%"),
    end_statement: () => seq("%}"),

    block_statement: ($) =>
      seq($.block_start_statement, repeat($._node), $.block_end_statement),

    block_start_statement: ($) =>
      seq(
        $.start_statement,
        alias("block", $.tag_name),
        $.identifier,
        $.end_statement,
      ),

    block_end_statement: ($) =>
      seq($.start_statement, alias("endblock", $.tag_name), $.end_statement),

    call_statement: ($) =>
      seq(
        $.start_statement,
        alias("call", $.tag_name),
        alias($._statement_content, $.statement_content),
        $.end_statement,
      ),

    include_statement: ($) =>
      seq(
        $.start_statement,
        alias("include", $.tag_name),
        alias($.string, $.path),
        $.end_statement,
      ),

    import_statement: ($) =>
      seq(
        $.start_statement,
        alias("import", $.tag_name),
        alias($.string, $.path),
        optional(seq(alias("as", $.keyword), $.identifier)),
        $.end_statement,
      ),

    // FIX: Temporary fix
    macro_arguments: $ => /[^)]+/,
    // macro_argument: ($) => seq($.identifier, $._macro_argument_end, optional(",")),

    open_parent: () => "(",
    close_parent: () => ")",

    macro_statement: ($) =>
      seq($.macro_start_statement, repeat($._node), $.macro_end_statement),

    macro_start_statement: ($) =>
      seq(
        $.start_statement,
        alias("macro", $.tag_name),
        seq(
          $.identifier,
          $.open_parent,
          $.macro_arguments,
          // repeat(alias($.macro_argument, $.argument)),
          $.close_parent,
        ),
        $.end_statement,
      ),

    macro_end_statement: ($) =>
      seq($.start_statement, alias("endmacro", $.tag_name), $.end_statement),

    extends_statement: ($) =>
      seq(
        $.start_statement,
        alias("extends", $.tag_name),
        alias($.string, $.path),
        $.end_statement,
      ),

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
