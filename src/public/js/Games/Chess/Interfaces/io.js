var GUI = (function(){
	return{
		MirrorFiles : [ FILES.FILE_H, FILES.FILE_G, FILES.FILE_F, FILES.FILE_E, FILES.FILE_D, FILES.FILE_C, FILES.FILE_B, FILES.FILE_A ],
	 	MirrorRanks : [ RANKS.RANK_8, RANKS.RANK_7, RANKS.RANK_6, RANKS.RANK_5, RANKS.RANK_4, RANKS.RANK_3, RANKS.RANK_2, RANKS.RANK_1 ],
		SqGUI : new Array(8),
		LastSQ1 : null,
		LastSQ2 : null
	}
}());
GUI.SqFromAlg = function(moveAlg) { // return the square from string name 'moveAlg' ex: e1 -> square number 25

	//console.log('SqFromAlg' + moveAlg);
	if(moveAlg.length != 2) return SQUARES.NO_SQ;

	if(moveAlg[0] > 'h' || moveAlg[0] < 'a' ) return SQUARES.NO_SQ;
	if(moveAlg[1] > '8' || moveAlg[1] < '1' ) return SQUARES.NO_SQ;

	file = moveAlg[0].charCodeAt() - 'a'.charCodeAt();
	rank = moveAlg[1].charCodeAt() - '1'.charCodeAt();

	return FR2SQ(file,rank);
}

GUI.PrintMoveList = function () {
	var index;
	var move;
	console.log("MoveList:");

	for(index = GameBoard.moveListStart[GameBoard.ply]; index < GameBoard.moveListStart[GameBoard.ply + 1]; ++index) {

		move = GameBoard.moveList[index];
		console.log("Move:" + (index+1) + " > " + GUI.PrMove(move));

	}
}

GUI.PrSq = function(sq) {
	var file = FilesBrd[sq];
	var rank = RanksBrd[sq];

	var sqStr = String.fromCharCode('a'.charCodeAt() + file) + String.fromCharCode('1'.charCodeAt() + rank);
	return sqStr;
}

GUI.PrMove = function(move) {

	var MvStr;

	var ff = FilesBrd[FROMSQ(move)];
	var rf = RanksBrd[FROMSQ(move)];
	var ft = FilesBrd[TOSQ(move)];
	var rt = RanksBrd[TOSQ(move)];

	MvStr = String.fromCharCode('a'.charCodeAt() + ff) + String.fromCharCode('1'.charCodeAt() + rf) + ' '+
				String.fromCharCode('a'.charCodeAt() + ft) + String.fromCharCode('1'.charCodeAt() + rt)

	var promoted = PROMOTED(move);

	if(promoted != PIECES.EMPTY) {
		var pchar = 'q';
		if(PieceKnight[promoted] == true) {
			pchar = 'n';
		} else if(PieceRookQueen[promoted] == true && PieceBishopQueen[promoted] == false)  {
			pchar = 'r';
		} else if(PieceRookQueen[promoted] == false && PieceBishopQueen[promoted] == true)   {
			pchar = 'b';
		}
		 MvStr += pchar;
	}
	return MvStr;
}

GUI.ParseMove = function (from, to) {

  Move.GenerateMoves();

	var move = NOMOVE;
	var sc;
	var PromPce = PIECES.EMPTY;
	var found = false;

	for(index = GameBoard.moveListStart[GameBoard.ply]; index < GameBoard.moveListStart[GameBoard.ply + 1]; ++index) {
		move = GameBoard.moveList[index];
		sc = GameBoard.moveScores[index];
		if(FROMSQ(move)==from && TOSQ(move)==to) {
			PromPce = PROMOTED(move);
			if(PromPce!=PIECES.EMPTY) {
				if( (PromPce==PIECES.wQ && GameBoard.side==COLOURS.WHITE) || (PromPce==PIECES.bQ && GameBoard.side==COLOURS.BLACK) ) {
					found = true;
					break;
				}
				continue;
			}
			found = true;
			break;
		}
    }

	if(found != false) {
		if(Move.MakeMove(move) == false) {
			return null;
		}
		sc =  Evaluate.EvalPosition();
		Move.TakeMove();
		return { move: move, score : sc};
	}

    return null;
}
