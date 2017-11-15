var GameBoard = {};

// board variables
GameBoard.side = COLOURS.WHITE;				// which side play now
GameBoard.pieces = new Array(BRD_SQ_NUM);	// Array contains the piece in each square in the board
GameBoard.enPas = SQUARES.NO_SQ;			// <En Passant> It is a special pawn capture, that can only occur immediately after a pawn moves two ranks forward from its starting position and an enemy pawn could have captured it had the pawn moved only one square forward (the capturing pawn must be on its fifth rank prior to executing this maneuver).
GameBoard.fiftyMove;						// to determine draw in the game
GameBoard.ply;								// counter for moves in SEARCH TREE
GameBoard.hisPly;							// <history ply> counter for every move in the game from start (important for takeback during the game)
GameBoard.castlePerm;						// for castle permision
GameBoard.posKey;							// every board position has an unique key so we can detect draw situation if same key repeated many more
GameBoard.pceNum = new Array(13);			// represent the number of each piece in board, indexed by Piece
GameBoard.material = new Array(2);			// WHITE,BLACK material of pieces (sum pieces value in each side)
GameBoard.pList = new Array(14 * 10);		// represent the position of each piece in the board, ex: Xth white pawn square = pList[10 * white_pawn_value + X]

GameBoard.history = [];						// Array for takeback option

GameBoard.bookLines = [];

GameBoard.moveList = new Array(MAXDEPTH * MAXPOSITIONMOVES);	// this array stores all moves in all seach ply
GameBoard.moveScores = new Array(MAXDEPTH * MAXPOSITIONMOVES);	// this array stores all moves SCORE in all seach ply
GameBoard.moveListStart = new Array(MAXDEPTH);					// this array is index for the first move at a givn ply

GameBoard.PvTable = [];											// this array is a database that stores results of previously performed searches, it is a way to greatly reduce the search space of a chess tree with little negative impact. every entity of this array is an move and position_key
GameBoard.PvArray = new Array(MAXDEPTH);						// this array stores the best move sequence that engine found during the search
GameBoard.searchHistory = new Array(14 * BRD_SQ_NUM);
GameBoard.searchKillers = new Array(3 * MAXDEPTH);

/*
Killer Heuristic:
a dynamic, path-dependent move ordering technique.
It considers moves that caused a beta-cutoff in a sibling node as killer moves and orders them high on the list.
When a node fails high, a quiet move that caused a cutoff is stored in a table indexed by ply, typically containing TWO or THREE moves per ply.
The replacement scheme ought to ensure that all the available slots contain different moves.

History Heuristic:
a dynamic move ordering method based on the number of cutoffs caused by a given move irrespectively from the position in which the move has been made.
The Heuristic was invented by Jonathan Schaeffer in 1983 and works as follows: on a cutoff we increment a counter in a special table, addressed either by [from][to] (the Butterfly Boards) or by [piece][to].
The added value is typically depth * depth or 2 ^ depth, based on the assumption that otherwise moves from the plies near the leaves would have to much impact on the result.
Values retrieved from that table are used to order non-capturing moves.
This simple heuristics performs usually better than domain-dependent heuristics, though it may be combined with them.
For example, in Rebel only a few non-captures are ordered by history heuristics, then a piece-square approach is used .
In the literature, history heuristic is often presented as depth-independent generalization of the killer moves.
It is also said to reflect long-term plans in a position.
*/

// board functions

GameBoard.BoardToFen = function() {
	var fenStr = '';
	var rank,file,sq,piece;
	var emptyCount = 0;

	for(rank = RANKS.RANK_8; rank >= RANKS.RANK_1; rank--) {
		emptyCount = 0;
		for(file = FILES.FILE_A; file <= FILES.FILE_H; file++) {
			sq = FR2SQ(file,rank);
			piece = GameBoard.pieces[sq];
			if(piece == PIECES.EMPTY) {
				emptyCount++;
			} else {
				if(emptyCount!=0) {
					fenStr += String.fromCharCode('0'.charCodeAt() + emptyCount);
				}
				emptyCount = 0;
				fenStr += PceChar[piece];
			}
		}
		if(emptyCount!=0) {
			fenStr += String.fromCharCode('0'.charCodeAt() + emptyCount);
		}

		if(rank!=RANKS.RANK_1) {
			fenStr += '/'
		} else {
			fenStr += ' ';
		}
	}

	fenStr += SideChar[GameBoard.side] + ' ';
	if(GameBoard.enPas == SQUARES.NO_SQ) {
		fenStr += '- '
	} else {
		fenStr += GUI.PrSq(GameBoard.enPas) + ' ';
	}

	if(GameBoard.castlePerm == 0) {
		fenStr += '- '
	} else {
		if(GameBoard.castlePerm & CASTLEBIT.WKCA) fenStr += 'K';
		if(GameBoard.castlePerm & CASTLEBIT.WQCA) fenStr += 'Q';
		if(GameBoard.castlePerm & CASTLEBIT.BKCA) fenStr += 'k';
		if(GameBoard.castlePerm & CASTLEBIT.BQCA) fenStr += 'q';
	}
	fenStr += ' ';
	fenStr += GameBoard.fiftyMove;
	fenStr += ' ';
	var tempHalfMove = GameBoard.hisPly;
	if(GameBoard.side == COLOURS.BLACK) {
		tempHalfMove--;
	}
	fenStr += tempHalfMove/2;

	return fenStr;
}

GameBoard.CheckBoard = function () {

	var t_pceNum = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
	var t_material = [ 0, 0];

	var sq64,t_piece,t_pce_num,sq120,colour,pcount;

	// check piece lists
	for(t_piece = PIECES.wP; t_piece <= PIECES.bK; ++t_piece) {
		for(t_pce_num = 0; t_pce_num < GameBoard.pceNum[t_piece]; ++t_pce_num) {
			sq120 = GameBoard.pList[PCEINDEX(t_piece,t_pce_num)];
			if(GameBoard.pieces[sq120]!=t_piece) {
				console.log('Error Pce Lists');
				return false;
			}
		}
	}

	// check piece count and other counters
	for(sq64 = 0; sq64 < 64; ++sq64) {
		sq120 = SQ120(sq64);
		t_piece = GameBoard.pieces[sq120];
		t_pceNum[t_piece]++;
		t_material[PieceCol[t_piece]] += PieceVal[t_piece];
	}

	for(t_piece = PIECES.wP; t_piece <= PIECES.bK; ++t_piece) {
		if(t_pceNum[t_piece]!=GameBoard.pceNum[t_piece]) {
				console.log('Error t_pceNum');
				return false;
			}
	}

	if(t_material[COLOURS.WHITE]!=GameBoard.material[COLOURS.WHITE] || t_material[COLOURS.BLACK]!=GameBoard.material[COLOURS.BLACK]) {
				console.log('Error t_material');
				return false;
			}
	if(GameBoard.side!=COLOURS.WHITE && GameBoard.side!=COLOURS.BLACK) {
				console.log('Error GameBoard.side');
				return false;
			}
	if(GameBoard.GeneratePosKey()!=GameBoard.posKey) {
				console.log('Error GameBoard.posKey');
				return false;
			}


	return true;
}

GameBoard.printGameLine = function() {

	var moveNum = 0;
	var gameLine = "";
	for(moveNum = 0; moveNum < GameBoard.hisPly; ++moveNum) {
		gameLine += GUI.PrMove(GameBoard.history[moveNum].move) + " ";
	}
	//console.log('Game Line: ' + gameLine);
	return $.trim(gameLine);

}

GameBoard.LineMatch = function(BookLine,gameline) {
	//console.log("Matching " + gameline + " with " + BookLine + " len = " + gameline.length);
	for(var len = 0; len < gameline.length; ++len) {
		//console.log("Char Matching " + gameline[len] + " with " + BookLine[len]);
		if(len>=BookLine.length) { /*console.log('no match');*/ return false;	}
		if(gameline[len] != BookLine[len]) { /*console.log('no match'); */return false;	}
	}
	//console.log('Match');
	return true;
}

GameBoard.BookMove = function() {

	var gameLine = GameBoard.printGameLine();
	var bookMoves = [];

	var lengthOfLineHack = gameLine.length;

	if(gameLine.length == 0) lengthOfLineHack--;

	for(var bookLineNum = 0; bookLineNum <GameBoard.bookLines.length; ++bookLineNum) {

		if(GameBoard.LineMatch(GameBoard.bookLines[bookLineNum],gameLine) == true) {
			var move = GameBoard.bookLines[bookLineNum].substr(lengthOfLineHack + 1, 4);
			//console.log("Parsing book move:" + move);
			if(move.length==4) {
				var from = SqFromAlg(move.substr(0,2));
				var to = SqFromAlg(move.substr(2,2));
				//console.log('from:'+from+' to:'+to);
				varInternalMove = ParseMove(from,to);
				//console.log("varInternalMove:" + GUI.PrMove(varInternalMove));
				bookMoves.push(varInternalMove);
			}
		}

	}

	console.log("Total + " + bookMoves.length + " moves in array");

	if(bookMoves.length==0) return NOMOVE;

	var num = Math.floor(Math.random()*bookMoves.length);

	return bookMoves[num];
}

GameBoard.PrintPceLists = function() {
	var piece,pceNum;

	for(piece=PIECES.wP; piece <= PIECES.bK; ++piece) {
		for(pceNum = 0; pceNum < GameBoard.pceNum[piece]; ++pceNum) {
			console.log("Piece " + PceChar[piece] + " on " + GUI.PrSq(GameBoard.pList[PCEINDEX(piece,pceNum)]));
		}
	}

}

GameBoard.UpdateListsMaterial = function () {

	var piece,sq,index,colour;

	for(index = 0; index < BRD_SQ_NUM; ++index) {
		sq = index;
		piece = GameBoard.pieces[index];
		if(piece != PIECES.OFFBOARD && piece != PIECES.EMPTY) {
			colour = PieceCol[piece];

			GameBoard.material[colour] += PieceVal[piece];

			GameBoard.pList[PCEINDEX(piece,GameBoard.pceNum[piece])] = sq;
			GameBoard.pceNum[piece]++;
		}
	}
}

GameBoard.GeneratePosKey = function () {

	var sq = 0;
	var finalKey = 0;
	var piece = PIECES.EMPTY;

	// pieces
	for(sq = 0; sq < BRD_SQ_NUM; ++sq) {
		piece = GameBoard.pieces[sq];
		if(piece != PIECES.EMPTY && piece != SQUARES.OFFBOARD) {
			finalKey ^= PieceKeys[(piece * 120) + sq];
		}
	}

	if(GameBoard.side == COLOURS.WHITE) {
		finalKey ^= SideKey;
	}

	if(GameBoard.enPas != SQUARES.NO_SQ) {
		finalKey ^= PieceKeys[GameBoard.enPas];
	}

	finalKey ^= CastleKeys[GameBoard.castlePerm];

	return finalKey;
}

GameBoard.PrintBoard = function () {

	var sq,file,rank,piece;

	console.log("\nGame Board:\n");

	for(rank = RANKS.RANK_8; rank >= RANKS.RANK_1; rank--) {
		var line =((rank+1) + "  ");
		for(file = FILES.FILE_A; file <= FILES.FILE_H; file++) {
			sq = FR2SQ(file,rank);
			piece = GameBoard.pieces[sq];
			line += (" " + PceChar[piece] + " ");
		}
		console.log(line);
	}

	console.log("");
	var line = "   ";
	for(file = FILES.FILE_A; file <= FILES.FILE_H; file++) {
		line += (' ' + String.fromCharCode('a'.charCodeAt() + file) + ' ');
	}
	console.log(line);
	console.log("side:" + SideChar[GameBoard.side] );
	console.log("enPas:" + GameBoard.enPas);
	line = "";
	if(GameBoard.castlePerm & CASTLEBIT.WKCA) line += 'K';
	if(GameBoard.castlePerm & CASTLEBIT.WQCA) line += 'Q';
	if(GameBoard.castlePerm & CASTLEBIT.BKCA) line += 'k';
	if(GameBoard.castlePerm & CASTLEBIT.BQCA) line += 'q';

	console.log("castle:" + line);
	console.log("key:" + GameBoard.posKey.toString(16));
	//GameBoard.PrintPceLists();
}

GameBoard.ResetBoard = function () {

	var index = 0;

	for(index = 0; index < BRD_SQ_NUM; ++index) {
		GameBoard.pieces[index] = SQUARES.OFFBOARD;
	}

	for(index = 0; index < 64; ++index) {
		GameBoard.pieces[SQ120(index)] = PIECES.EMPTY;
	}

	for(index = 0; index < 14 * 120; ++index) {
		GameBoard.pList[index] = PIECES.EMPTY;
	}

	for(index = 0; index < 2; ++index) {
		GameBoard.material[index] = 0;
	}

	for(index = 0; index < 13; ++index) {
		GameBoard.pceNum[index] = 0;
	}

	GameBoard.side = COLOURS.BOTH;
	GameBoard.enPas = SQUARES.NO_SQ;
	GameBoard.fiftyMove = 0;
	GameBoard.ply = 0;
	GameBoard.hisPly = 0;
	GameBoard.castlePerm = 0;
	GameBoard.posKey = 0;
	GameBoard.moveListStart[GameBoard.ply] = 0;

}

GameBoard.ParseFen = function (fen) {

	var rank = RANKS.RANK_8;
    var file = FILES.FILE_A;
    var piece = 0;
    var count = 0;
    var i = 0;
	var sq64 = 0;
	var sq120 = 0;
	var fenCnt = 0;

	GameBoard.ResetBoard();

	while ((rank >= RANKS.RANK_1) && fenCnt < fen.length) {
	    count = 1;
		switch (fen[fenCnt]) {
            case 'p': piece = PIECES.bP; break;
            case 'r': piece = PIECES.bR; break;
            case 'n': piece = PIECES.bN; break;
            case 'b': piece = PIECES.bB; break;
            case 'k': piece = PIECES.bK; break;
            case 'q': piece = PIECES.bQ; break;
            case 'P': piece = PIECES.wP; break;
            case 'R': piece = PIECES.wR; break;
            case 'N': piece = PIECES.wN; break;
            case 'B': piece = PIECES.wB; break;
            case 'K': piece = PIECES.wK; break;
            case 'Q': piece = PIECES.wQ; break;

            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7':
            case '8':
                piece = PIECES.EMPTY;
                count = fen[fenCnt].charCodeAt() - '0'.charCodeAt();
                break;

            case '/':
            case ' ':
                rank--;
                file = FILES.FILE_A;
                fenCnt++;
                continue;

            default:
                printf("FEN error \n");
                return;
        }

		for (i = 0; i < count; i++) {
            sq64 = rank * 8 + file;
			sq120 = SQ120(sq64);
            if (piece != PIECES.EMPTY) {
                GameBoard.pieces[sq120] = piece;
            }
			file++;
        }
		fenCnt++;
	}

	GameBoard.side = (fen[fenCnt] == 'w') ? COLOURS.WHITE : COLOURS.BLACK;
	fenCnt += 2;

	for (i = 0; i < 4; i++) {
        if (fen[fenCnt] == ' ') {
            break;
        }
		switch(fen[fenCnt]) {
			case 'K': GameBoard.castlePerm |= CASTLEBIT.WKCA; break;
			case 'Q': GameBoard.castlePerm |= CASTLEBIT.WQCA; break;
			case 'k': GameBoard.castlePerm |= CASTLEBIT.BKCA; break;
			case 'q': GameBoard.castlePerm |= CASTLEBIT.BQCA; break;
			default:	     break;
        }
		fenCnt++;
	}
	fenCnt++;

	if (fen[fenCnt] != '-') {
		file = fen[fenCnt].charCodeAt() - 'a'.charCodeAt();
		rank = fen[fenCnt+1].charCodeAt() - '1'.charCodeAt();
		console.log("fen[fenCnt]:" + fen[fenCnt] + " File:" + file + " Rank:" + rank);
		GameBoard.enPas = FR2SQ(file,rank);
    }

    GameBoard.posKey = GameBoard.GeneratePosKey();
    GameBoard.UpdateListsMaterial();
}

GameBoard.SqAttacked = function(sq, side) {
	var pce;
	var t_sq;
	var index;

	if(side == COLOURS.WHITE) {
		if(GameBoard.pieces[sq-11] == PIECES.wP || GameBoard.pieces[sq-9] == PIECES.wP) {
			return true;
		}
	} else {
		if(GameBoard.pieces[sq+11] == PIECES.bP || GameBoard.pieces[sq+9] == PIECES.bP) {
			return true;
		}
	}

	for(index = 0; index < 8; ++index) {
		pce = GameBoard.pieces[sq + KnDir[index]];
		if(pce != SQUARES.OFFBOARD && PieceKnight[pce] == true && PieceCol[pce] == side) {
			return true;
		}
	}

	for(index = 0; index < 4; ++index) {
		dir = RkDir[index];
		t_sq = sq + dir;
		pce = GameBoard.pieces[t_sq];
		while(pce != SQUARES.OFFBOARD) {
			if(pce != PIECES.EMPTY) {
				if(PieceRookQueen[pce] == true && PieceCol[pce] == side) {
					return true;
				}
				break;
			}
			t_sq += dir;
			pce = GameBoard.pieces[t_sq];
		}
	}

	for(index = 0; index < 4; ++index) {
		dir = BiDir[index];
		t_sq = sq + dir;
		pce = GameBoard.pieces[t_sq];
		while(pce != SQUARES.OFFBOARD) {
			if(pce != PIECES.EMPTY) {
				if(PieceBishopQueen[pce] == true && PieceCol[pce] == side) {
					return true;
				}
				break;
			}
			t_sq += dir;
			pce = GameBoard.pieces[t_sq];
		}
	}

	for(index = 0; index < 8; ++index) {
		pce = GameBoard.pieces[sq + KiDir[index]];
		if(pce != SQUARES.OFFBOARD && PieceKing[pce] == true && PieceCol[pce] == side) {
			return true;
		}
	}

	return false;
}

GameBoard.PrintSqAttacked = function(side) {

	var sq,file,rank,piece;

	console.log("\nAttacked:\n");

	for(rank = RANKS.RANK_8; rank >= RANKS.RANK_1; rank--) {
		var line =((rank+1) + "  ");
		for(file = FILES.FILE_A; file <= FILES.FILE_H; file++) {
			sq = FR2SQ(file,rank);
			if(GameBoard.SqAttacked(sq, side) == true) piece = "X";
			else piece = "-";
			line += (" " + piece + " ");
		}
		console.log(line);
	}

	console.log("");
}
