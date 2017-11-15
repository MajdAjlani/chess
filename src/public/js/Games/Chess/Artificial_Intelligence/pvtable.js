/*
The Principal variation (PV) is a sequence of moves that programs consider best and therefore expect to be played.
All the nodes included by the PV are PV-nodes.
Inside an iterative deepening framework, it is the most important move ordering consideration to play the PV collected during the current iteration, as the very first left moves of the next iteration.
Although not needed for pure chess playing, most engines print the Principal Variation every time it changes or a new depth is reached for analyzing purposes.
There are several implementations to determine the PV - most notably the three mentioned below, which were often controversial discussed in Computer Chess Forums with all their pros and contras
*/


function GetPvLine(depth) {;

	//console.log("GetPvLine");
	
	var move = ProbePvTable();
	var count = 0;
	
	while(move != NOMOVE && count < depth) {
	
		if( Move.MoveExists(move) ) {
			Move.MakeMove(move);
			GameBoard.PvArray[count++] = move;
			//console.log("GetPvLine added " + PrMove(move));	
		} else {
			break;
		}		
		move = ProbePvTable();	
	}
	
	while(GameBoard.ply > 0) {
		Move.TakeMove();
	}
	return count;
	
}

function StorePvMove(move) {

	var index = GameBoard.posKey % PVENTRIES;	
	
	GameBoard.PvTable[index].move = move;
    GameBoard.PvTable[index].posKey = GameBoard.posKey;
}

function ProbePvTable() {

	var index = GameBoard.posKey % PVENTRIES;	
	
	if( GameBoard.PvTable[index].posKey == GameBoard.posKey ) {
		return GameBoard.PvTable[index].move;
	}
	
	return NOMOVE;
}

function ClearPvTable() {
	
	for(index = 0; index < PVENTRIES; index++) {
			GameBoard.PvTable[index].move = NOMOVE;
			GameBoard.PvTable[index].posKey = 0;
		
	}
}