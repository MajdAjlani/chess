var Evaluate = (function(){
	return{
		RookOpenFile : 10,
		RookSemiOpenFile : 5,
		QueenOpenFile : 5,
		QueenSemiOpenFile : 3,
		BishopPair : 30,

		PawnRanksWhite : new Array(10),
		PawnRanksBlack : new Array(10),

		PawnIsolated : -10,
		PawnPassed : [ 0, 5, 10, 20, 35, 60, 100, 200 ], 

		PawnTable : [
		0	,	0	,	0	,	0	,	0	,	0	,	0	,	0	,
		10	,	10	,	0	,	-10	,	-10	,	0	,	10	,	10	,
		5	,	0	,	0	,	5	,	5	,	0	,	0	,	5	,
		0	,	0	,	10	,	20	,	20	,	10	,	0	,	0	,
		5	,	5	,	5	,	10	,	10	,	5	,	5	,	5	,
		10	,	10	,	10	,	20	,	20	,	10	,	10	,	10	,
		20	,	20	,	20	,	30	,	30	,	20	,	20	,	20	,
		0	,	0	,	0	,	0	,	0	,	0	,	0	,	0	
		],

		KnightTable : [
		0	,	-10	,	0	,	0	,	0	,	0	,	-10	,	0	,
		0	,	0	,	0	,	5	,	5	,	0	,	0	,	0	,
		0	,	0	,	10	,	10	,	10	,	10	,	0	,	0	,
		0	,	0	,	10	,	20	,	20	,	10	,	5	,	0	,
		5	,	10	,	15	,	20	,	20	,	15	,	10	,	5	,
		5	,	10	,	10	,	20	,	20	,	10	,	10	,	5	,
		0	,	0	,	5	,	10	,	10	,	5	,	0	,	0	,
		0	,	0	,	0	,	0	,	0	,	0	,	0	,	0		
		],

		BishopTable : [
		0	,	0	,	-10	,	0	,	0	,	-10	,	0	,	0	,
		0	,	0	,	0	,	10	,	10	,	0	,	0	,	0	,
		0	,	0	,	10	,	15	,	15	,	10	,	0	,	0	,
		0	,	10	,	15	,	20	,	20	,	15	,	10	,	0	,
		0	,	10	,	15	,	20	,	20	,	15	,	10	,	0	,
		0	,	0	,	10	,	15	,	15	,	10	,	0	,	0	,
		0	,	0	,	0	,	10	,	10	,	0	,	0	,	0	,
		0	,	0	,	0	,	0	,	0	,	0	,	0	,	0	
		],

		RookTable : [
		0	,	0	,	5	,	10	,	10	,	5	,	0	,	0	,
		0	,	0	,	5	,	10	,	10	,	5	,	0	,	0	,
		0	,	0	,	5	,	10	,	10	,	5	,	0	,	0	,
		0	,	0	,	5	,	10	,	10	,	5	,	0	,	0	,
		0	,	0	,	5	,	10	,	10	,	5	,	0	,	0	,
		0	,	0	,	5	,	10	,	10	,	5	,	0	,	0	,
		25	,	25	,	25	,	25	,	25	,	25	,	25	,	25	,
		0	,	0	,	5	,	10	,	10	,	5	,	0	,	0		
		],

		KingE : [	
			-50	,	-10	,	0	,	0	,	0	,	0	,	-10	,	-50	,
			-10,	0	,	10	,	10	,	10	,	10	,	0	,	-10	,
			0	,	10	,	20	,	20	,	20	,	20	,	10	,	0	,
			0	,	10	,	20	,	40	,	40	,	20	,	10	,	0	,
			0	,	10	,	20	,	40	,	40	,	20	,	10	,	0	,
			0	,	10	,	20	,	20	,	20	,	20	,	10	,	0	,
			-10,	0	,	10	,	10	,	10	,	10	,	0	,	-10	,
			-50	,	-10	,	0	,	0	,	0	,	0	,	-10	,	-50	
		],

		KingO : [	
			0	,	5	,	5	,	-10	,	-10	,	0	,	10	,	5	,
			-30	,	-30	,	-30	,	-30	,	-30	,	-30	,	-30	,	-30	,
			-50	,	-50	,	-50	,	-50	,	-50	,	-50	,	-50	,	-50	,
			-70	,	-70	,	-70	,	-70	,	-70	,	-70	,	-70	,	-70	,
			-70	,	-70	,	-70	,	-70	,	-70	,	-70	,	-70	,	-70	,
			-70	,	-70	,	-70	,	-70	,	-70	,	-70	,	-70	,	-70	,
			-70	,	-70	,	-70	,	-70	,	-70	,	-70	,	-70	,	-70	,
			-70	,	-70	,	-70	,	-70	,	-70	,	-70	,	-70	,	-70		
		]
	}
})();


Evaluate.MaterialDraw = function () {
    if (0 === GameBoard.pceNum[PIECES.wR] && 0 === GameBoard.pceNum[PIECES.bR] && 0 === GameBoard.pceNum[PIECES.wQ] && 0 === GameBoard.pceNum[PIECES.bQ]) {
	  if (0 === GameBoard.pceNum[PIECES.bB] && 0 === GameBoard.pceNum[PIECES.wB]) {
	      if (GameBoard.pceNum[PIECES.wN] < 3 && GameBoard.pceNum[PIECES.bN] < 3) {  return true; }
	  } else if (0 === GameBoard.pceNum[PIECES.wN] && 0 === GameBoard.pceNum[PIECES.bN]) {
	     if (Math.abs(GameBoard.pceNum[PIECES.wB] - GameBoard.pceNum[PIECES.bB]) < 2) { return true; }
	  } else if ((GameBoard.pceNum[PIECES.wN] < 3 && 0 === GameBoard.pceNum[PIECES.wB]) || (GameBoard.pceNum[PIECES.wB] == 1 && 0 == GameBoard.pceNum[PIECES.wN])) {
	    if ((GameBoard.pceNum[PIECES.bN] < 3 && 0 === GameBoard.pceNum[PIECES.bB]) || (GameBoard.pceNum[PIECES.bB] == 1 && 0 == GameBoard.pceNum[PIECES.bN]))  { return true; }
	  }
	} else if (0 === GameBoard.pceNum[PIECES.wQ] && 0 === GameBoard.pceNum[PIECES.bQ]) {
        if (GameBoard.pceNum[PIECES.wR] === 1 && GameBoard.pceNum[PIECES.bR] === 1) {
            if ((GameBoard.pceNum[PIECES.wN] + GameBoard.pceNum[PIECES.wB]) < 2 && (GameBoard.pceNum[PIECES.bN] + GameBoard.pceNum[PIECES.bB]) < 2)	{ return true; }
        } else if (GameBoard.pceNum[PIECES.wR] === 1 && 0 === GameBoard.pceNum[PIECES.bR]) {
            if ((GameBoard.pceNum[PIECES.wN] + GameBoard.pceNum[PIECES.wB] === 0) && (((GameBoard.pceNum[PIECES.bN] + GameBoard.pceNum[PIECES.bB]) === 1) || ((GameBoard.pceNum[PIECES.bN] + GameBoard.pceNum[PIECES.bB]) == 2))) { return true; }
        } else if (GameBoard.pceNum[PIECES.bR] === 1 && 0 === GameBoard.pceNum[PIECES.wR]) {
            if ((GameBoard.pceNum[PIECES.bN] + GameBoard.pceNum[PIECES.bB] === 0) && (((GameBoard.pceNum[PIECES.wN] + GameBoard.pceNum[PIECES.wB]) === 1) || ((GameBoard.pceNum[PIECES.wN] + GameBoard.pceNum[PIECES.wB]) == 2))) { return true; }
        }
    }
  return false;
}



var ENDGAME_MAT = 1 * PieceVal[PIECES.wR] + 2 * PieceVal[PIECES.wN] + 2 * PieceVal[PIECES.wP] + PieceVal[PIECES.wK];

Evaluate.PawnsInit = function() {
	var index = 0;
	
	for(index = 0; index < 10; ++index) {				
		Evaluate.PawnRanksWhite[index] = RANKS.RANK_8;			
		Evaluate.PawnRanksBlack[index] = RANKS.RANK_1;
	}
	
	pce = PIECES.wP;	
	for(pceNum = 0; pceNum < GameBoard.pceNum[pce]; ++pceNum) {
		sq = GameBoard.pList[PCEINDEX(pce,pceNum)];
		if(RanksBrd[sq] < Evaluate.PawnRanksWhite[FilesBrd[sq]+1]) {
			Evaluate.PawnRanksWhite[FilesBrd[sq]+1] = RanksBrd[sq];
		}
	}	

	pce = PIECES.bP;	
	for(pceNum = 0; pceNum < GameBoard.pceNum[pce]; ++pceNum) {
		sq = GameBoard.pList[PCEINDEX(pce,pceNum)];
		if(RanksBrd[sq] > Evaluate.PawnRanksBlack[FilesBrd[sq]+1]) {
			Evaluate.PawnRanksBlack[FilesBrd[sq]+1] = RanksBrd[sq];
		}			
	}	
}

Evaluate.EvalPosition = function() {

	var pce;
	var pceNum;
	var sq;
	var score = GameBoard.material[COLOURS.WHITE] - GameBoard.material[COLOURS.BLACK];
	var file;
	var rank;
	if(0 == GameBoard.pceNum[PIECES.wP] && 0 == GameBoard.pceNum[PIECES.bP] && Evaluate.MaterialDraw() == true) {
		return 0;
	}
	
	Evaluate.PawnsInit();
	
	pce = PIECES.wP;	
	for(pceNum = 0; pceNum < GameBoard.pceNum[pce]; ++pceNum) {
		sq = GameBoard.pList[PCEINDEX(pce,pceNum)];
		score += Evaluate.PawnTable[SQ64(sq)];	
		file = FilesBrd[sq]+1;
		rank = RanksBrd[sq];
		if(Evaluate.PawnRanksWhite[file-1]==RANKS.RANK_8 && Evaluate.PawnRanksWhite[file+1]==RANKS.RANK_8) {
			score += Evaluate.PawnIsolated;
		}
		
		if(Evaluate.PawnRanksBlack[file-1]<=rank && Evaluate.PawnRanksBlack[file]<=rank && Evaluate.PawnRanksBlack[file+1]<=rank) {
			score += Evaluate.PawnPassed[rank];
		}
	}	

	pce = PIECES.bP;	
	for(pceNum = 0; pceNum < GameBoard.pceNum[pce]; ++pceNum) {
		sq = GameBoard.pList[PCEINDEX(pce,pceNum)];
		score -= Evaluate.PawnTable[MIRROR64(SQ64(sq))];	
		file = FilesBrd[sq]+1;
		rank = RanksBrd[sq];
		if(Evaluate.PawnRanksBlack[file-1]==RANKS.RANK_1 && Evaluate.PawnRanksBlack[file+1]==RANKS.RANK_1) {
			score -= Evaluate.PawnIsolated;
		}	
		
		if(Evaluate.PawnRanksWhite[file-1]>=rank && Evaluate.PawnRanksWhite[file]>=rank && Evaluate.PawnRanksWhite[file+1]>=rank) {
			score -= Evaluate.PawnPassed[7-rank];
		}	
	}	
	
	pce = PIECES.wN;	
	for(pceNum = 0; pceNum < GameBoard.pceNum[pce]; ++pceNum) {
		sq = GameBoard.pList[PCEINDEX(pce,pceNum)];
		score += Evaluate.KnightTable[SQ64(sq)];
	}	

	pce = PIECES.bN;	
	for(pceNum = 0; pceNum < GameBoard.pceNum[pce]; ++pceNum) {
		sq = GameBoard.pList[PCEINDEX(pce,pceNum)];
		score -= Evaluate.KnightTable[MIRROR64(SQ64(sq))];
	}			
	
	pce = PIECES.wB;	
	for(pceNum = 0; pceNum < GameBoard.pceNum[pce]; ++pceNum) {
		sq = GameBoard.pList[PCEINDEX(pce,pceNum)];
		score += Evaluate.BishopTable[SQ64(sq)];
	}	

	pce = PIECES.bB;	
	for(pceNum = 0; pceNum < GameBoard.pceNum[pce]; ++pceNum) {
		sq = GameBoard.pList[PCEINDEX(pce,pceNum)];
		score -= Evaluate.BishopTable[MIRROR64(SQ64(sq))];
	}	

	pce = PIECES.wR;	
	for(pceNum = 0; pceNum < GameBoard.pceNum[pce]; ++pceNum) {
		sq = GameBoard.pList[PCEINDEX(pce,pceNum)];
		score += Evaluate.RookTable[SQ64(sq)];	
		file = FilesBrd[sq]+1;
		if(Evaluate.PawnRanksWhite[file]==RANKS.RANK_8) {
			if(Evaluate.PawnRanksBlack[file]==RANKS.RANK_1) {
				score += Evaluate.RookOpenFile;
			} else  {
				score += Evaluate.RookSemiOpenFile;
			}
		}
	}	

	pce = PIECES.bR;	
	for(pceNum = 0; pceNum < GameBoard.pceNum[pce]; ++pceNum) {
		sq = GameBoard.pList[PCEINDEX(pce,pceNum)];
		score -= Evaluate.RookTable[MIRROR64(SQ64(sq))];	
		file = FilesBrd[sq]+1;
		if(Evaluate.PawnRanksBlack[file]==RANKS.RANK_1) {
			if(Evaluate.PawnRanksWhite[file]==RANKS.RANK_8) {
				score -= Evaluate.RookOpenFile;
			} else  {
				score -= Evaluate.RookSemiOpenFile;
			}
		}
	}
	
	pce = PIECES.wQ;	
	for(pceNum = 0; pceNum < GameBoard.pceNum[pce]; ++pceNum) {
		sq = GameBoard.pList[PCEINDEX(pce,pceNum)];
		score += Evaluate.RookTable[SQ64(sq)];	
		file = FilesBrd[sq]+1;
		if(Evaluate.PawnRanksWhite[file]==RANKS.RANK_8) {
			if(Evaluate.PawnRanksBlack[file]==RANKS.RANK_1) {
				score += Evaluate.QueenOpenFile;
			} else  {
				score += Evaluate.QueenSemiOpenFile;
			}
		}
	}	

	pce = PIECES.bQ;	
	for(pceNum = 0; pceNum < GameBoard.pceNum[pce]; ++pceNum) {
		sq = GameBoard.pList[PCEINDEX(pce,pceNum)];
		score -= Evaluate.RookTable[MIRROR64(SQ64(sq))];	
		file = FilesBrd[sq]+1;
		if(Evaluate.PawnRanksBlack[file]==RANKS.RANK_1) {
			if(Evaluate.PawnRanksWhite[file]==RANKS.RANK_8) {
				score -= Evaluate.QueenOpenFile;
			} else  {
				score -= Evaluate.QueenSemiOpenFile;
			}
		}
	}	
	
	pce = PIECES.wK;
	sq = GameBoard.pList[PCEINDEX(pce,0)];
	
	if( (GameBoard.material[COLOURS.BLACK] <= ENDGAME_MAT) ) {
		score += Evaluate.KingE[SQ64(sq)];
	} else {
		score += Evaluate.KingO[SQ64(sq)];
	}
	
	pce = PIECES.bK;
	sq = GameBoard.pList[PCEINDEX(pce,0)];
	
	if( (GameBoard.material[COLOURS.WHITE] <= ENDGAME_MAT) ) {
		score -= Evaluate.KingE[MIRROR64(SQ64(sq))];
	} else {
		score -= Evaluate.KingO[MIRROR64(SQ64(sq))];
	}
	
	if(GameBoard.pceNum[PIECES.wB] >= 2) score += Evaluate.BishopPair;
	if(GameBoard.pceNum[PIECES.bB] >= 2) score -= Evaluate.BishopPair;
	
	if(GameBoard.side == COLOURS.WHITE) {
		return score;
	} else {
		return -score;
	}	
}