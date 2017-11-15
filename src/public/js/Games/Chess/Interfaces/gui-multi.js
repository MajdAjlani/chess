GUI.MIRROR120 = function(sq) {
	var file = GUI.MirrorFiles[FilesBrd[sq]];
	var rank = GUI.MirrorRanks[RanksBrd[sq]];
	return FR2SQ(file,rank);
}

GUI.CheckResult = function() {

    if (GameBoard.fiftyMove > 100) {
     	$("#GameStatus").text("GAME DRAWN {fifty move rule}");
		 	swal("GAME DRAWN", "fifty move rule!", "warning");
			return true;
    }


	if (DrawMaterial() == true) {
     $("#GameStatus").text("GAME DRAWN {insufficient material to mate}");
	 	swal("GAME DRAWN", "insufficient material to mate!", "warning");
		 return true;
    }

	console.log('Checking end of game');
	Move.GenerateMoves();

  var MoveNum = 0;
	var found = 0;
	for(MoveNum = GameBoard.moveListStart[GameBoard.ply]; MoveNum < GameBoard.moveListStart[GameBoard.ply + 1]; ++MoveNum)  {

        if ( Move.MakeMove(GameBoard.moveList[MoveNum]) == false)  {
            continue;
        }
        found++;
		Move.TakeMove();
		break;
    }


	if(found != 0) return false;
	var InCheck = GameBoard.SqAttacked(GameBoard.pList[PCEINDEX(Kings[GameBoard.side],0)], GameBoard.side^1);
	console.log('No Move Found, incheck:' + InCheck);

	if(InCheck == true)	{
	    if(GameBoard.side == COLOURS.WHITE) {
	      $("#GameStatus").text("GAME OVER {black mates}");
				swal({
					title: 'Game Over',
					text: 'BLACK mates!',
					type: "info",
				});
				return true;
        } else {
	      $("#GameStatus").text("GAME OVER {white mates}");
				swal({
					title: 'Game Over',
					text: 'WHITE mates!',
					type: "info",
				});
				return true;
        }
    }
    console.log('Returning False');
	return false;
}


GUI.changeColour = function(from,to)
{
	if(GUI.LastSQ1 !== null)
		$(GUI.LastSQ1).removeClass('DeSqSelected');
	GUI.LastSQ1 = GUI.SqGUI[RanksBrd[from]][FilesBrd[from]];
	$(GUI.LastSQ1).addClass('DeSqSelected');
	if(GUI.LastSQ2 !== null)
		$(GUI.LastSQ2).removeClass('DeSqSelected');
	GUI.LastSQ2 = GUI.SqGUI[RanksBrd[to]][FilesBrd[to]];
	$(GUI.LastSQ2).addClass('DeSqSelected');
}

GUI.ClickedSquare = function(pageX, pageY) {
	var position = $("#Board").position();
	console.log("Piece clicked at " + pageX + "," + pageY + " board top:" + position.top + " board left:" + position.left);

	var workedX = Math.floor(position.left);
	var workedY = Math.floor(position.top);
	var pageX = Math.floor(pageX);
	var pageY = Math.floor(pageY);

	var file = Math.floor((pageX-workedX) / 60);
	var rank = 7 - Math.floor((pageY-workedY) / 60);

	var sq = FR2SQ(file,rank);


	if(GameController.BoardFlipped == true) {
		sq = GUI.MIRROR120(sq);
	}

	console.log("WorkedX: " + workedX + " WorkedY:" + workedY + " File:" + file + " Rank:" + rank);
	console.log("clicked:" + GUI.PrSq(sq));

	GUI.SetSqSelected(sq); // must go here before mirror

	return sq;

}

GUI.CheckAndSet = function() {
	if(GUI.CheckResult() != true) {
		GameController.GameOver = false;
		$("#GameStatus").text('');
	} else {
		GameController.GameOver = true;
		GameController.GameSaved = true; // save the game here
	}
	//var fenStr = GameBoard.BoardToFen();
	 $("#currentFenSpan").text(GameBoard.BoardToFen());
}



$(document).on('click','.Piece', function (e) {
	console.log("Piece Click");
	if(GameController.PlayerSide == GameBoard.side) {
		if(UserMove.from == SQUARES.NO_SQ)
			UserMove.from = GUI.ClickedSquare(e.pageX, e.pageY);
		else
			UserMove.to = GUI.ClickedSquare(e.pageX, e.pageY);

		GUI.MakeUserMove();
	}
});

$(document).on('click','.Square', function (e) {
	console.log("Square Click");
	if(GameController.PlayerSide == GameBoard.side && UserMove.from != SQUARES.NO_SQ) {
		UserMove.to = GUI.ClickedSquare(e.pageX, e.pageY);
		GUI.MakeUserMove();
	}
});


GUI.RemoveGUIPiece = function(sq) {
	//console.log("remove on:" + GUI.PrSq(sq));
	$( ".Piece" ).each(function( index ) {
		 //console.log( "Picture:" + index + ": " + $(this).position().top + "," + $(this).position().left );
		 if( (RanksBrd[sq] == 7 - Math.round($(this).position().top/60)) && (FilesBrd[sq] == Math.round($(this).position().left/60)) ){
		 	//console.log( "Picture:" + index + ": " + $(this).position().top + "," + $(this).position().left );
			$(this).remove();
		 }
	});
}

GUI.AddGUIPiece = function(sq,pce) {

	var rank = RanksBrd[sq];
	var file = FilesBrd[sq];
	var rankName = "rank" + (rank + 1);
	var fileName = "file" + (file + 1);
	pieceFileName = "/public/img/chesspieces/wikipedia/" + SideChar[PieceCol[pce]] + PceChar[pce].toUpperCase() + ".png";
	imageString = "<image src=\"" + pieceFileName + "\" class=\"Piece clickElement " + rankName + " " + fileName + "\"/>";
	//console.log("add on " + imageString);
	$("#Board").append(imageString);
}



GUI.MoveGUIPiece = function(move) {
	var from = FROMSQ(move);
	var to = TOSQ(move);
	var flippedFrom = from;
	var flippedTo = to;
	var epWhite = -10;
	var epBlack = 10;

	if(GameController.BoardFlipped == true) {
		flippedFrom = GUI.MIRROR120(from);
		flippedTo = GUI.MIRROR120(to);
		epWhite = 10;
		epBlack = -10;
	}

	GUI.changeColour(flippedFrom,flippedTo);

	if(move & MFLAGEP) {
		var epRemove;
		if(GameBoard.side == COLOURS.BLACK) {
			epRemove = flippedTo + epWhite;
		} else {
			epRemove = flippedTo + epBlack;
		}
		console.log("en pas removing from " + GUI.PrSq(epRemove));
		GUI.RemoveGUIPiece(epRemove);
	} else if(CAPTURED(move)) {
		GUI.RemoveGUIPiece(flippedTo);
	}

	var rank = RanksBrd[flippedTo];
	var file = FilesBrd[flippedTo];
	var rankName = "rank" + (rank + 1);
	var fileName = "file" + (file + 1);

	/*if(GameController.BoardFlipped == true) {
		rankName += "flip";
		fileName += "flip";
	}*/

	$( ".Piece" ).each(function( index ) {
     //console.log( "Picture:" + index + ": " + $(this).position().top + "," + $(this).position().left );
     if( (RanksBrd[flippedFrom] == 7 - Math.round($(this).position().top/60)) && (FilesBrd[flippedFrom] == Math.round($(this).position().left/60)) ){
     	//console.log("Setting pic ff:" + FilesBrd[from] + " rf:" + RanksBrd[from] + " tf:" + FilesBrd[to] + " rt:" + RanksBrd[to]);
		$(this).removeClass();
     	$(this).addClass("Piece clickElement " + rankName + " " + fileName);

     }
    });

    if(move & MFLAGCA) {
    	if(GameController.BoardFlipped == true) {
			switch (to) {
				case SQUARES.G1: GUI.RemoveGUIPiece(GUI.MIRROR120(SQUARES.H1));GUI.AddGUIPiece(GUI.MIRROR120(SQUARES.F1),PIECES.wR); break;
				case SQUARES.C1: GUI.RemoveGUIPiece(GUI.MIRROR120(SQUARES.A1));GUI.AddGUIPiece(GUI.MIRROR120(SQUARES.D1),PIECES.wR); break;
				case SQUARES.G8: GUI.RemoveGUIPiece(GUI.MIRROR120(SQUARES.H8));GUI.AddGUIPiece(GUI.MIRROR120(SQUARES.F8),PIECES.bR); break;
				case SQUARES.C8: GUI.RemoveGUIPiece(GUI.MIRROR120(SQUARES.A8));GUI.AddGUIPiece(GUI.MIRROR120(SQUARES.D8),PIECES.bR); break;
			}
		} else {
			switch (to) {
				case SQUARES.G1: GUI.RemoveGUIPiece(SQUARES.H1);GUI.AddGUIPiece(SQUARES.F1,PIECES.wR); break;
				case SQUARES.C1: GUI.RemoveGUIPiece(SQUARES.A1);GUI.AddGUIPiece(SQUARES.D1,PIECES.wR); break;
				case SQUARES.G8: GUI.RemoveGUIPiece(SQUARES.H8);GUI.AddGUIPiece(SQUARES.F8,PIECES.bR); break;
				case SQUARES.C8: GUI.RemoveGUIPiece(SQUARES.A8);GUI.AddGUIPiece(SQUARES.D8,PIECES.bR); break;
			}
		}
    }
    var prom = PROMOTED(move);
    console.log("PromPce:" + prom);
    if(prom != PIECES.EMPTY) {
		console.log("prom removing from " + GUI.PrSq(flippedTo));
    	GUI.RemoveGUIPiece(flippedTo);
    	GUI.AddGUIPiece(flippedTo,prom);
    }

    GameBoard.printGameLine();
}

GUI.DeselectSq = function(sq) {

	if(GameController.BoardFlipped == true) {
		sq = GUI.MIRROR120(sq);
	}

	$(GUI.SqGUI[RanksBrd[sq]][FilesBrd[sq]]).removeClass('SqSelected');

}

GUI.SetSqSelected = function(sq) {

	if(GameController.BoardFlipped == true) {
		sq = GUI.MIRROR120(sq);
	}
	$(GUI.SqGUI[RanksBrd[(sq)]][FilesBrd[(sq)]]).addClass('SqSelected');
}






GUI.initBoardSquares = function() {


	var light = 0;
	var rankName;
	var fileName;
	var divString;
	var lightString;
	var lastLight=0;

	for(rankIter = RANKS.RANK_8; rankIter >= RANKS.RANK_1; rankIter--) {
		light = lastLight ^ 1;
		lastLight ^= 1;
		rankName = "rank" + (rankIter + 1);
		for(fileIter = FILES.FILE_A; fileIter <= FILES.FILE_H; fileIter++) {
		    fileName = "file" + (fileIter + 1);
		    if(light==0) lightString="Light";
			else lightString="Dark";
			divString = "<div class=\"Square clickElement " + rankName + " " + fileName + " " + lightString + "\"/>";
			//console.log(divString);
			light ^= 1;
			$("#Board").append(divString);
		}
	}
}

GUI.ClearAllPieces = function() {
	console.log("Removing pieces");
	$(".Piece").remove();
}

GUI.SetInitialBoardPieces = function() {
	var sq;
	var sq120;
	var file,rank;
	var rankName;
	var fileName;
	var imageString;
	var pieceFileName;
	var pce;
	GUI.ClearAllPieces();
	for( sq = 0; sq < 64; ++sq) {

		sq120 = SQ120(sq);

		pce = GameBoard.pieces[sq120]; // crucial here

		if(GameController.BoardFlipped == true) {
			sq120 = GUI.MIRROR120(sq120);
		}

		file = FilesBrd[sq120];
		rank = RanksBrd[sq120];


		if(pce>=PIECES.wP && pce<=PIECES.bK) {
			rankName = "rank" + (rank + 1);
			fileName = "file" + (file + 1);

			pieceFileName = "/public/img/chesspieces/wikipedia/" + SideChar[PieceCol[pce]] + PceChar[pce].toUpperCase() + ".png";
			imageString = "<image src=\"" + pieceFileName + "\" class=\"Piece " + rankName + " " + fileName + "\"/>";
			//console.log(imageString);
			$("#Board").append(imageString);
		}
	}

	for(var i = 0 ; i < 8 ; ++i)
	{
		GUI.SqGUI[i] = new Array(8);
	}
	for(var sq = 0; sq < 64; ++sq){
		$( ".Square" ).each(function( index ) {
		if( (RanksBrd[SQ120(sq)] == 7 - Math.round($(this).position().top/60)) && (FilesBrd[SQ120(sq)] == Math.round($(this).position().left/60)) ){
			GUI.SqGUI[RanksBrd[SQ120(sq)]][FilesBrd[SQ120(sq)]] = this;
		}
		});
	}

}



function ThreeFoldRep() {
	var i = 0, r = 0;
	for (i = 0; i < GameBoard.hisPly; ++i)	{
	    if (GameBoard.history[i].posKey == GameBoard.posKey) {
		    r++;
		}
	}
	return r;
}

function DrawMaterial() {

    if (GameBoard.pceNum[PIECES.wP]!=0 || GameBoard.pceNum[PIECES.bP]!=0) return false;
    if (GameBoard.pceNum[PIECES.wQ]!=0 || GameBoard.pceNum[PIECES.bQ]!=0 || GameBoard.pceNum[PIECES.wR]!=0 || GameBoard.pceNum[PIECES.bR]!=0) return false;
    if (GameBoard.pceNum[PIECES.wB] > 1 || GameBoard.pceNum[PIECES.bB] > 1) {return false;}
    if (GameBoard.pceNum[PIECES.wN] > 1 || GameBoard.pceNum[PIECES.bN] > 1) {return false;}
    if (GameBoard.pceNum[PIECES.wN]!=0 && GameBoard.pceNum[PIECES.wB]!=0) {return false;}
    if (GameBoard.pceNum[PIECES.bN]!=0 && GameBoard.pceNum[PIECES.bB]!=0) {return false;}

    return true;
}
