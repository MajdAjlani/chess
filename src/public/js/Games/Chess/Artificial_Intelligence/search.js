var SearchController = (function(){
	return{
		nodes : 0,
		fh : 0,
		fhf : 0,
		depth : 0,
		time : 0,
		start : 0,
		stop : 0,
		best : 0,
		thinking : 0,
	}
})();



SearchController.CheckUp = function() {
	if( ($.now()-SearchController.start) > SearchController.time ) SearchController.stop = true;
}

SearchController.PickNextMove = function(moveNum) {

	var index = 0;
	var bestScore = 0;
	var bestNum = moveNum;

	for (index = moveNum; index < GameBoard.moveListStart[GameBoard.ply + 1]; ++index) {
		if (GameBoard.moveScores[index] > bestScore) {
			bestScore = GameBoard.moveScores[index];
			bestNum = index;
		}
	}

	temp = GameBoard.moveList[moveNum];
	GameBoard.moveList[moveNum] = GameBoard.moveList[bestNum];
	GameBoard.moveList[bestNum] = temp;

	temp = GameBoard.moveScores[moveNum];
	GameBoard.moveScores[moveNum] = GameBoard.moveScores[bestNum];
	GameBoard.moveScores[bestNum] = temp;
}

SearchController.IsRepetition = function() {

	var index = 0;

	for(index = GameBoard.hisPly - GameBoard.fiftyMove; index < GameBoard.hisPly-1; ++index) {
		if(GameBoard.posKey == GameBoard.history[index].posKey) {
			return true;
		}
	}
	return false;
}



SearchController.ClearForSearch = function () {

	var index = 0;
	var index2 = 0;

	for(index = 0; index < 14 * BRD_SQ_NUM; ++index) {
		GameBoard.searchHistory[index] = 0;
	}

	for(index = 0; index < 3 * MAXDEPTH; ++index) {
		GameBoard.searchKillers[index] = 0;
	}

	ClearPvTable();

	GameBoard.ply = 0;

	SearchController.nodes = 0;
	SearchController.fh = 0;
	SearchController.fhf = 0;
	SearchController.start = $.now();
	SearchController.stop = false;
}


SearchController.Quiescence = function(alpha, beta) {

	if((SearchController.nodes & 2047) == 0) SearchController.CheckUp();

	SearchController.nodes++;

	if(SearchController.IsRepetition() || GameBoard.fiftyMove >= 100) {
		return 0;
	}

	if(GameBoard.ply > MAXDEPTH - 1) {
		return Evaluate.EvalPosition();
	}

	var Score = Evaluate.EvalPosition();

	if(Score >= beta) {
		return beta;
	}

	if(Score > alpha) {
		alpha = Score;
	}

	Move.GenerateCaptures();

    var MoveNum = 0;
	var Legal = 0;
	var OldAlpha = alpha;
	var BestMove = NOMOVE;
	Score = -INFINITE;
	var PvMove = ProbePvTable();

	if( PvMove != NOMOVE) {
		for(MoveNum = GameBoard.moveListStart[GameBoard.ply]; MoveNum < GameBoard.moveListStart[GameBoard.ply + 1]; ++MoveNum) {
			if( GameBoard.moveList[MoveNum] == PvMove) {
				GameBoard.moveScores[MoveNum].score = 2000000;
				break;
			}
		}
	}

	for(MoveNum = GameBoard.moveListStart[GameBoard.ply]; MoveNum < GameBoard.moveListStart[GameBoard.ply + 1]; ++MoveNum)  {

		SearchController.PickNextMove(MoveNum);

        if ( Move.MakeMove(GameBoard.moveList[MoveNum]) == false)  {
            continue;
        }

		Legal++;
		Score = -SearchController.Quiescence( -beta, -alpha);
		Move.TakeMove();
		if(SearchController.stop == true) return 0;
		if(Score > alpha) {
			if(Score >= beta) {
				if(Legal==1) {
					SearchController.fhf++;
				}
				SearchController.fh++;

				return beta;
			}
			alpha = Score;
			BestMove = GameBoard.moveList[MoveNum];
		}
    }

	if(alpha != OldAlpha) {
		StorePvMove(BestMove);
	}

	return alpha;
}

SearchController.AlphaBeta = function(alpha, beta, depth, DoNull) {


	if(depth <= 0) {
		return SearchController.Quiescence(alpha, beta);
		// return Evaluate.EvalPosition();
	}
	if((SearchController.nodes & 2047) == 0) SearchController.CheckUp();

	SearchController.nodes++;

	if((SearchController.IsRepetition() || GameBoard.fiftyMove >= 100) && GameBoard.ply != 0) {
		return 0;
	}

	if(GameBoard.ply > MAXDEPTH - 1) {
		return Evaluate.EvalPosition();
	}

	var InCheck = GameBoard.SqAttacked(GameBoard.pList[PCEINDEX(Kings[GameBoard.side],0)], GameBoard.side^1);

	if(InCheck == true) {
		depth++;
	}

	var Score = -INFINITE;

	if( DoNull == true && false == InCheck &&
			GameBoard.ply != 0 && (GameBoard.material[GameBoard.side] > 50200) && depth >= 4) {


		var ePStore = GameBoard.enPas;
		if(GameBoard.enPas != SQUARES.NO_SQ) HASH_EP();
		GameBoard.side ^= 1;
    	HASH_SIDE();
    	GameBoard.enPas = SQUARES.NO_SQ;

		Score = -SearchController.AlphaBeta( -beta, -beta + 1, depth-4, false);

		GameBoard.side ^= 1;
    	HASH_SIDE();
		GameBoard.enPas = ePStore;
		if(GameBoard.enPas != SQUARES.NO_SQ) HASH_EP();

		if(SearchController.stop == true) return 0;
		if (Score >= beta) {
		  return beta;
		}
	}

  Move.GenerateMoves();

  var MoveNum = 0;
	var Legal = 0;
	var OldAlpha = alpha;
	var BestMove = NOMOVE;
	Score = -INFINITE;
	var PvMove = ProbePvTable();

	if( PvMove != NOMOVE) {
		for(MoveNum = GameBoard.moveListStart[GameBoard.ply]; MoveNum < GameBoard.moveListStart[GameBoard.ply + 1]; ++MoveNum) {
			if( GameBoard.moveList[MoveNum] == PvMove) {
				GameBoard.moveScores[MoveNum].score = 2000000;
				break;
			}
		}
	}

	for(MoveNum = GameBoard.moveListStart[GameBoard.ply]; MoveNum < GameBoard.moveListStart[GameBoard.ply + 1]; ++MoveNum)  {

		SearchController.PickNextMove(MoveNum);

    if ( Move.MakeMove(GameBoard.moveList[MoveNum]) == false)  {
        continue;
    }

		Legal++;
		Score = -SearchController.AlphaBeta( -beta, -alpha, depth-1, true);
		Move.TakeMove();
		if(SearchController.stop == true) return 0;

		if(Score > alpha) {
			if(Score >= beta) {
				if(Legal==1) {
					SearchController.fhf++;
				}
				SearchController.fh++;

				if((GameBoard.moveList[MoveNum] & MFLAGCAP) == 0) {
					GameBoard.searchKillers[MAXDEPTH + GameBoard.ply] = GameBoard.searchKillers[GameBoard.ply];
					GameBoard.searchKillers[GameBoard.ply] = GameBoard.moveList[MoveNum];
				}
				return beta;
			}
			alpha = Score;
			BestMove = GameBoard.moveList[MoveNum];
			if((BestMove & MFLAGCAP) == 0) {
				GameBoard.searchHistory[ GameBoard.pieces[FROMSQ(BestMove)] * BRD_SQ_NUM + TOSQ(BestMove) ] += depth * depth;
			}
		}
  }

	if(Legal == 0) {
		if(InCheck) {
			return -MATE + GameBoard.ply;
		} else {
			return 0;
		}
	}

	if(alpha != OldAlpha) {
		StorePvMove(BestMove);
	}

	return alpha;
}



SearchController.SearchPosition = function() {

	var bestMove = NOMOVE;
	var bestScore = -INFINITE;
	var currentDepth = 0;
	var pvNum = 0;
	var line;
	SearchController.ClearForSearch();

	if(GameController.BookLoaded == true) {
		bestMove = BookMove();

		if(bestMove != NOMOVE) {
			$("#OrderingOut").text("Ordering:");
			$("#DepthOut").text("Depth: ");
			$("#ScoreOut").text("Score:");
			$("#NodesOut").text("Nodes:");
			$("#TimeOut").text("Time: 0s");
			$("#BestOut").text("BestMove: " + GUI.PrMove(bestMove) + '(Book)');
			SearchController.best = bestMove;
			SearchController.thinking = false;
			return;
		}
	}

	// iterative deepening
	for( currentDepth = 1; currentDepth <= SearchController.depth; ++currentDepth ) {

		bestScore = SearchController.AlphaBeta(-INFINITE, INFINITE, currentDepth, true);
		if(SearchController.stop == true) break;
		pvNum = GetPvLine(currentDepth);
		bestMove = GameBoard.PvArray[0];
		line = ("Depth:" + currentDepth + " best:" + GUI.PrMove(bestMove) + " Score:" + bestScore + " nodes:" + SearchController.nodes);

		if(currentDepth!=1) {
			line += (" Ordering:" + ((SearchController.fhf/SearchController.fh)*100).toFixed(2) + "%");
		}
		console.log(line);

		DOMupdate.depth = currentDepth;
		DOMupdate.move = bestMove;
		DOMupdate.score = bestScore;
		DOMupdate.nodes = SearchController.nodes;
		DOMupdate.ordering = ((SearchController.fhf/SearchController.fh)*100).toFixed(2);
	}

	$("#BestOut").text("BestMove: " + GUI.PrMove(bestMove));
	DOMupdate.UpdateDOMStats();
	SearchController.best = bestMove;
	SearchController.thinking = false;

}

var DOMupdate = (function(){
	return{
		depth : 0,
		move : 0,
		score : 0,
		nodes : 0,
		ordering : 0
	}
})();


DOMupdate.UpdateDOMStats = function() {
		var scoreText = "Score: " + (DOMupdate.score/100).toFixed(2);
		if(Math.abs(DOMupdate.score) > MATE-MAXDEPTH) {
			scoreText = "Score: " + "Mate In " + (MATE - Math.abs(DOMupdate.score)) + " moves";
		}

		//console.log("UpdateDOMStats depth:" + DOMupdate.depth + " score:" + DOMupdate.score + " nodes:" + DOMupdate.nodes);
		$("#OrderingOut").text("Ordering: " + DOMupdate.ordering + "%");
		$("#DepthOut").text("Depth: " + DOMupdate.depth);
		$("#ScoreOut").text(scoreText);
		$("#NodesOut").text("Nodes: " + DOMupdate.nodes);
		$("#TimeOut").text("Time: " + (($.now()-SearchController.start)/1000).toFixed(1) + "s");
}
