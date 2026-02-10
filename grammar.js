const PREC = {
	logical: 0,
	comparative: 1,
	concat: 2,
	additive: 3,
	multiplicative: 4,
	function: 5,
	case: 6,
	join: 8,
	setop: 9
}

module.exports = grammar({
	name: 'radb',

	rules: {

		source_file: $ => repeat($._statement),

		_statement: $ => choice(
			$.view,
			$.query,
			$.utility
		),

		view: $ => seq(field("viewname",$.IDENTIFIER),
					   $.DEFAS,
					   field("viewquery",$.query)),

		query: $ => seq($._algebraop,$._SEMICOLON),

		_algebraop: $ => choice(
			$.selection,
			$.projection,
			$.aggregation,
			$.join,
			$.tableaccess,
			$.rename,
			$._setop,
			$._parenop
		),

		_parenop: $ => seq($._OPENPAREN,
						   $._algebraop,
						   $._CLOSEPAREN),

		utility: $ => choice(
			$.listschema,
			$.quit,
      $.clear,
      $.clearview,
      $.save,
      $.source,
      $.sqlexec
    ),

		/////////////////////////////////////////////////////////////////////////
		//                           utility commands                          //
		/////////////////////////////////////////////////////////////////////////
		listschema: $ => makeUtility($, $.LIST),
		quit: $ => makeUtility($, $.QUIT),
    clear: $ => makeUtility($, $.CLEAR, $._ASTERIX),
    clearview: $ => makeUtility($, $.CLEAREXCL,
                                field("viewname",$.IDENTIFIER)),
    save: $ => makeUtility($, $.SAVE,
                           field("viewname",optional($.IDENTIFIER)),
                           field("filename", $.STRING)),
    source: $ => makeUtility($, $.SOURCE, field("filename", $.STRING)),
    sqlexec: $ => makeUtility($, $.SQLEXEC, $.SQLCODE),

    LIST: $ => "\\list",
    QUIT: $ => "\\quit",
    CLEAR: $ => "\\clear",
    CLEAREXCL: $ => "\\clear!",
    SAVE: $ => "\\save",
    SOURCE: $ => "\\source",
    SQLEXEC: $ => "\\sqlexec",

		/////////////////////////////////////////////////////////////////////////
		//                          Alegbra operators                          //
		/////////////////////////////////////////////////////////////////////////
		selection: $ => makeUnaryOp($, $.SELECT,
									field("condition", $._expr)),

		projection: $ => makeUnaryOp($, $.PROJECT,
									 field("exprs", $._exprlist)),

		rename: $ => makeUnaryOp($, $.RENAME,
								 field("newnames", $._attrlist)),

		aggregation: $ => makeUnaryOp($, $.AGGREGATION,
							  choice(field("aggfuncs", $.aggrflist),
									 seq(field("aggfuncs", $.aggrflist),
										 $._COLON,
										 field("groupby", $._attrlist)))),

		tableaccess: $ => field("tablename", $.IDENTIFIER),

		join: $ => prec.left(PREC.join,choice(makeBinaryOp($, $.JOIN),
									makeBinaryOp($, $.CROSS),
									makeBinaryOp($, $.JOIN,field("condition", $._expr)))),

		_setop: $ => choice($.union,
							$.difference,
							$.intersection),

		union: $ => prec.left(PREC.setop,makeBinaryOp($, $.UNION)),
		difference: $ => prec.left(PREC.setop,makeBinaryOp($, $.DIFFERENCE)),
		intersection: $ => prec.left(PREC.setop,makeBinaryOp($, $.INTERSECTION)),

		/////////////////////////////////////////////////////////////////////////
		//                             expressions                             //
		/////////////////////////////////////////////////////////////////////////
		aggrflist: $ => commaSep1($.aggf),

		aggf: $ => seq($.agg_function, $._OPENPAREN, $.attr, $._CLOSEPAREN),

		_exprlist: $ => commaSep1($._expr),

		_attrlist: $ => commaSep1($.attr),

		attr: $ => $.IDENTIFIER,

		_expr: $ => choice(
			prec.left(PREC.function,$.function_call),
			$.attr,
			$.binary_expr,
			$.constant,
			seq($._OPENPAREN, $._expr, $._CLOSEPAREN)
		),

		function_call: $ => seq(
			field("name", choice(
				$.agg_function,
				$.function_name
			)),
			$.function_args
		),

		agg_function: $ => choice("sum","avg","count","min","max"),

		function_args: $ => seq(
			"(",
			commaSep($._expr),
			")"
		),

		function_name: $ => choice(
			prec(2,$.agg_function),
			prec(1,$.IDENTIFIER)
		),

		agg_function: $ => choice("sum","avg","count","min","max"),

		predicate_name: $ => $.IDENTIFIER,

		binary_expr: $ => {
			const table = [
				[PREC.concat, '||'],
				[PREC.logical, "and", "or"],
				[PREC.comparative, choice('=', '!=', '<', '<=', '>', '>=')],
				[PREC.additive, choice('+', '-')],
				[PREC.multiplicative, choice('*', '/', '%')],
			];

			return choice(...table.map(([precedence, operator]) => prec.left(precedence, seq(
				field('left', $._expr),
				field('operator', operator),
				field('right', $._expr),
			))));
		},

		constant: $ => choice(
			$.NUMBER,
			$.STRING
		),


		/////////////////////////////////////////////////////////////////////////
		//                               keywords                              //
		/////////////////////////////////////////////////////////////////////////
		_SEMICOLON: $ => ";",
		_COLON: $ => ":",
		DEFAS: $ => ":-",
		SELECT: $ => "\\select",
		PROJECT: $ => "\\project",
		JOIN: $ => "\\join",
		RENAME: $ => "\\rename",
		AGGREGATION: $ => "\\aggr",
		UNION: $ => "\\union",
		DIFFERENCE: $ => "\\difference",
		INTERSECTION: $ => "\\intersect",
		CROSS: $ => "\\cross",

		/////////////////////////////////////////////////////////////////////////
		//                             other tokens                            //
		/////////////////////////////////////////////////////////////////////////
		IDENTIFIER: $ => /[a-zA-Z_][a-zA-Z_0-9]*/,

		_UNDERSCORE: $ => "_",
		_OPENPAREN: $ => "(",
		_CLOSEPAREN: $ => ")",
		_OPENCURLY: $ => "{",
		_CLOSECURLY: $ => "}",
    _ASTERIX: $ => "*",

		FLOAT: $ => /[-]?[0-9]+[.][0-9]+/,
		DOT: $ => /[.]/,
		INTEGER: $ => /[-]?[0-9]+/,
		NUMBER: $ => choice(
			$.INTEGER,
			prec(10,$.FLOAT)
		),

		STRING: $ => /[\'][^\']*[\']/,
    SQLCODE: $ => /[}]+/,
	}
});

function makeOpParameter(env, params) {
  return seq(env._UNDERSCORE, env._OPENCURLY, params, env._CLOSECURLY)
}

function makeUnaryOp(env, op, params) {
	return seq(op,
             makeOpParameter(env, params),
			       env._OPENPAREN, field("input", env._algebraop), env._CLOSEPAREN
			      );
}


function makeBinaryOp(env, op, params) {
	if(params === undefined)
	{
		return seq(field("leftinput", env._algebraop),
				   op,
				   field("rightinput", env._algebraop));
	}
	else
	{
		return seq(field("leftinput", env._algebraop),
				   op,
				   makeOpParameter(env, params),
				   field("rightinput", env._algebraop));
	}
}

function makeUtility(env, cmd, params) {
	if(params === undefined)
	{
		return seq(field("command",cmd), env._SEMICOLON);
	}
	else
	{
		return seq(field("command",cmd),
               params,
               env._SEMICOLON);
	}
}

function commaSep1(rule) {
	return seq(rule, repeat(seq(',', rule)))
}

function commaSep(rule) {
	return optional(commaSep1(rule))
}
