var Move = (function(){
	return{
		VictimScore : [0, 100, 200, 300, 400, 500, 600, 100, 200, 300, 400, 500, 600],
		MvvLvaScores : new Array(14 * 14)
	}
})();



Move.InitMvvLva = function() {
    var Attacker;
    var Victim;
    for (Attacker = PIECES.wP; Attacker <= PIECES.bK; ++Attacker) {
        for (Victim = PIECES.wP; Victim <= PIECES.bK; ++Victim) {
            Move.MvvLvaScores[Victim * 14 + Attacker] = Move.VictimScore[Victim] + 6 - (Move.VictimScore[Attacker] / 100);
        }
    }
}


Move.setMove = function(from, to, captured, promoted, flag) {
    return (from | (to << 7) | (captured << 14) | (promoted << 20) | flag);
}

Move.MoveExists = function(move) {

    Move.GenerateMoves();

    var index;
    var moveFound = NOMOVE;
    for (index = GameBoard.moveListStart[GameBoard.ply]; index < GameBoard.moveListStart[GameBoard.ply + 1]; ++index) {

        moveFound = GameBoard.moveList[index];
        if (Move.MakeMove(moveFound) == false) {
            continue;
        }
        Move.TakeMove();
        if (move == moveFound) {
            return true;
        }
    }
    return false;
}

Move.AddCaptureMove = function(move) {
    GameBoard.moveList[GameBoard.moveListStart[GameBoard.ply + 1]] = move;
    GameBoard.moveScores[GameBoard.moveListStart[GameBoard.ply + 1]++] = Move.MvvLvaScores[CAPTURED(move) * 14 + GameBoard.pieces[FROMSQ(move)]] + 1000000;
}

Move.AddQuietMove = function(move) {
    GameBoard.moveList[GameBoard.moveListStart[GameBoard.ply + 1]] = move;

    if (GameBoard.searchKillers[GameBoard.ply] == move) {
        GameBoard.moveScores[GameBoard.moveListStart[GameBoard.ply + 1]] = 900000;
    } else if (GameBoard.searchKillers[MAXDEPTH + GameBoard.ply] == move) {
        GameBoard.moveScores[GameBoard.moveListStart[GameBoard.ply + 1]] = 800000;
    } else {
        GameBoard.moveScores[GameBoard.moveListStart[GameBoard.ply + 1]] = GameBoard.searchHistory[GameBoard.pieces[FROMSQ(move)] * BRD_SQ_NUM + TOSQ(move)];
    }
    GameBoard.moveListStart[GameBoard.ply + 1]++;
}

Move.AddEnPassantMove = function(move) {
    GameBoard.moveList[GameBoard.moveListStart[GameBoard.ply + 1]] = move;
    GameBoard.moveScores[GameBoard.moveListStart[GameBoard.ply + 1]++] = 105 + 1000000;
}

Move.AddWhitePawnCaptureMove = function(from, to, cap) {
    if (RanksBrd[from] == RANKS.RANK_7) {
        Move.AddCaptureMove(Move.setMove(from, to, cap, PIECES.wQ, 0));
        Move.AddCaptureMove(Move.setMove(from, to, cap, PIECES.wR, 0));
        Move.AddCaptureMove(Move.setMove(from, to, cap, PIECES.wB, 0));
        Move.AddCaptureMove(Move.setMove(from, to, cap, PIECES.wN, 0));
    } else {
        Move.AddCaptureMove(Move.setMove(from, to, cap, PIECES.EMPTY, 0));
    }
}

Move.AddWhitePawnQuietMove = function(from, to) {
    if (RanksBrd[from] == RANKS.RANK_7) {
        Move.AddQuietMove(Move.setMove(from, to, PIECES.EMPTY, PIECES.wQ, 0));
        Move.AddQuietMove(Move.setMove(from, to, PIECES.EMPTY, PIECES.wR, 0));
        Move.AddQuietMove(Move.setMove(from, to, PIECES.EMPTY, PIECES.wB, 0));
        Move.AddQuietMove(Move.setMove(from, to, PIECES.EMPTY, PIECES.wN, 0));
    } else {
        Move.AddQuietMove(Move.setMove(from, to, PIECES.EMPTY, PIECES.EMPTY, 0));
    }
}

Move.AddBlackPawnCaptureMove = function(from, to, cap) {
    if (RanksBrd[from] == RANKS.RANK_2) {
        Move.AddCaptureMove(Move.setMove(from, to, cap, PIECES.bQ, 0));
        Move.AddCaptureMove(Move.setMove(from, to, cap, PIECES.bR, 0));
        Move.AddCaptureMove(Move.setMove(from, to, cap, PIECES.bB, 0));
        Move.AddCaptureMove(Move.setMove(from, to, cap, PIECES.bN, 0));
    } else {
        Move.AddCaptureMove(Move.setMove(from, to, cap, PIECES.EMPTY, 0));
    }
}

Move.AddBlackPawnQuietMove = function(from, to) {
    if (RanksBrd[from] == RANKS.RANK_2) {
        Move.AddQuietMove(Move.setMove(from, to, PIECES.EMPTY, PIECES.bQ, 0));
        Move.AddQuietMove(Move.setMove(from, to, PIECES.EMPTY, PIECES.bR, 0));
        Move.AddQuietMove(Move.setMove(from, to, PIECES.EMPTY, PIECES.bB, 0));
        Move.AddQuietMove(Move.setMove(from, to, PIECES.EMPTY, PIECES.bN, 0));
    } else {
        Move.AddQuietMove(Move.setMove(from, to, PIECES.EMPTY, PIECES.EMPTY, 0));
    }
}


Move.GenerateMoves = function() {
    GameBoard.moveListStart[GameBoard.ply + 1] = GameBoard.moveListStart[GameBoard.ply];
    var pceType;
    var pceNum;
    var pceIndex;
    var pce;
    var sq;
    var tsq;
    var index;
    if (GameBoard.side == COLOURS.WHITE) {
        pceType = PIECES.wP;
        for (pceNum = 0; pceNum < GameBoard.pceNum[pceType]; ++pceNum) {
            sq = GameBoard.pList[PCEINDEX(pceType, pceNum)];
            if (GameBoard.pieces[sq + 10] == PIECES.EMPTY) {
                Move.AddWhitePawnQuietMove(sq, sq + 10);
                if (RanksBrd[sq] == RANKS.RANK_2 && GameBoard.pieces[sq + 20] == PIECES.EMPTY) {
                    Move.AddQuietMove(Move.setMove(sq, (sq + 20), PIECES.EMPTY, PIECES.EMPTY, MFLAGPS));
                }
            }

            if (SQOFFBOARD(sq + 9) == false && PieceCol[GameBoard.pieces[sq + 9]] == COLOURS.BLACK) {
                Move.AddWhitePawnCaptureMove(sq, sq + 9, GameBoard.pieces[sq + 9]);
            }
            if (SQOFFBOARD(sq + 11) == false && PieceCol[GameBoard.pieces[sq + 11]] == COLOURS.BLACK) {
                Move.AddWhitePawnCaptureMove(sq, sq + 11, GameBoard.pieces[sq + 11]);
            }

            if (GameBoard.enPas != SQUARES.NO_SQ) {
                if (sq + 9 == GameBoard.enPas) {
                    Move.AddEnPassantMove(Move.setMove(sq, sq + 9, PIECES.EMPTY, PIECES.EMPTY, MFLAGEP));
                }
                if (sq + 11 == GameBoard.enPas) {
                    Move.AddEnPassantMove(Move.setMove(sq, sq + 11, PIECES.EMPTY, PIECES.EMPTY, MFLAGEP));
                }
            }
        }
        if (GameBoard.castlePerm & CASTLEBIT.WKCA) {
            if (GameBoard.pieces[SQUARES.F1] == PIECES.EMPTY && GameBoard.pieces[SQUARES.G1] == PIECES.EMPTY) {
                if (GameBoard.SqAttacked(SQUARES.E1, COLOURS.BLACK) == false && GameBoard.SqAttacked(SQUARES.F1, COLOURS.BLACK) == false) {
                    Move.AddQuietMove(Move.setMove(SQUARES.E1, SQUARES.G1, PIECES.EMPTY, PIECES.EMPTY, MFLAGCA));
                }
            }
        }

        if (GameBoard.castlePerm & CASTLEBIT.WQCA) {
            if (GameBoard.pieces[SQUARES.D1] == PIECES.EMPTY && GameBoard.pieces[SQUARES.C1] == PIECES.EMPTY && GameBoard.pieces[SQUARES.B1] == PIECES.EMPTY) {
                if (GameBoard.SqAttacked(SQUARES.E1, COLOURS.BLACK) == false && GameBoard.SqAttacked(SQUARES.D1, COLOURS.BLACK) == false) {
                    Move.AddQuietMove(Move.setMove(SQUARES.E1, SQUARES.C1, PIECES.EMPTY, PIECES.EMPTY, MFLAGCA));
                }
            }
        }

        pceType = PIECES.wN; // HACK to set for loop other pieces

    } else {
        pceType = PIECES.bP;
        for (pceNum = 0; pceNum < GameBoard.pceNum[pceType]; ++pceNum) {
            sq = GameBoard.pList[PCEINDEX(pceType, pceNum)];

            if (GameBoard.pieces[sq - 10] == PIECES.EMPTY) {
                Move.AddBlackPawnQuietMove(sq, sq - 10);
                if (RanksBrd[sq] == RANKS.RANK_7 && GameBoard.pieces[sq - 20] == PIECES.EMPTY) {
                    Move.AddQuietMove(Move.setMove(sq, (sq - 20), PIECES.EMPTY, PIECES.EMPTY, MFLAGPS));
                }
            }

            if (SQOFFBOARD(sq - 9) == false && PieceCol[GameBoard.pieces[sq - 9]] == COLOURS.WHITE) {
                Move.AddBlackPawnCaptureMove(sq, sq - 9, GameBoard.pieces[sq - 9]);
            }

            if (SQOFFBOARD(sq - 11) == false && PieceCol[GameBoard.pieces[sq - 11]] == COLOURS.WHITE) {
                Move.AddBlackPawnCaptureMove(sq, sq - 11, GameBoard.pieces[sq - 11]);
            }
            if (GameBoard.enPas != SQUARES.NO_SQ) {
                if (sq - 9 == GameBoard.enPas) {
                    Move.AddEnPassantMove(Move.setMove(sq, sq - 9, PIECES.EMPTY, PIECES.EMPTY, MFLAGEP));
                }
                if (sq - 11 == GameBoard.enPas) {
                    Move.AddEnPassantMove(Move.setMove(sq, sq - 11, PIECES.EMPTY, PIECES.EMPTY, MFLAGEP));
                }
            }
        }
        if (GameBoard.castlePerm & CASTLEBIT.BKCA) {
            if (GameBoard.pieces[SQUARES.F8] == PIECES.EMPTY && GameBoard.pieces[SQUARES.G8] == PIECES.EMPTY) {
                if (GameBoard.SqAttacked(SQUARES.E8, COLOURS.WHITE) == false && GameBoard.SqAttacked(SQUARES.F8, COLOURS.WHITE) == false) {
                    Move.AddQuietMove(Move.setMove(SQUARES.E8, SQUARES.G8, PIECES.EMPTY, PIECES.EMPTY, MFLAGCA));
                }
            }
        }

        if (GameBoard.castlePerm & CASTLEBIT.BQCA) {
            if (GameBoard.pieces[SQUARES.D8] == PIECES.EMPTY && GameBoard.pieces[SQUARES.C8] == PIECES.EMPTY && GameBoard.pieces[SQUARES.B8] == PIECES.EMPTY) {
                if (GameBoard.SqAttacked(SQUARES.E8, COLOURS.WHITE) == false && GameBoard.SqAttacked(SQUARES.D8, COLOURS.WHITE) == false) {
                    Move.AddQuietMove(Move.setMove(SQUARES.E8, SQUARES.C8, PIECES.EMPTY, PIECES.EMPTY, MFLAGCA));
                }
            }
        }

        pceType = PIECES.bN; // HACK to set for loop other pieces
    }


    pceIndex = LoopSlideIndex[GameBoard.side];
    pce = LoopSlidePce[pceIndex++];
    while (pce != 0) {

        for (pceNum = 0; pceNum < GameBoard.pceNum[pce]; ++pceNum) {
            sq = GameBoard.pList[PCEINDEX(pce, pceNum)];

            for (index = 0; index < DirNum[pce]; ++index) {
                dir = PceDir[pce][index];
                t_sq = sq + dir;

                while (SQOFFBOARD(t_sq) == false) {

                    if (GameBoard.pieces[t_sq] != PIECES.EMPTY) {
                        if (PieceCol[GameBoard.pieces[t_sq]] == GameBoard.side ^ 1) {
                            Move.AddCaptureMove(Move.setMove(sq, t_sq, GameBoard.pieces[t_sq], PIECES.EMPTY, 0));
                        }
                        break;
                    }
                    Move.AddQuietMove(Move.setMove(sq, t_sq, PIECES.EMPTY, PIECES.EMPTY, 0));
                    t_sq += dir;
                }
            }
        }
        pce = LoopSlidePce[pceIndex++];
    }

    pceIndex = LoopNonSlideIndex[GameBoard.side];
    pce = LoopNonSlidePce[pceIndex++];

    while (pce != 0) {

        for (pceNum = 0; pceNum < GameBoard.pceNum[pce]; ++pceNum) {
            sq = GameBoard.pList[PCEINDEX(pce, pceNum)];

            for (index = 0; index < DirNum[pce]; ++index) {
                dir = PceDir[pce][index];
                t_sq = sq + dir;

                if (SQOFFBOARD(t_sq) == true) {
                    continue;
                }

                if (GameBoard.pieces[t_sq] != PIECES.EMPTY) {
                    if (PieceCol[GameBoard.pieces[t_sq]] == GameBoard.side ^ 1) {
                        Move.AddCaptureMove(Move.setMove(sq, t_sq, GameBoard.pieces[t_sq], PIECES.EMPTY, 0));
                    }
                    continue;
                }
                Move.AddQuietMove(Move.setMove(sq, t_sq, PIECES.EMPTY, PIECES.EMPTY, 0));
            }
        }
        pce = LoopNonSlidePce[pceIndex++];
    }

}


Move.GenerateCaptures = function() {
    GameBoard.moveListStart[GameBoard.ply + 1] = GameBoard.moveListStart[GameBoard.ply];
    var pceType;
    var pceNum;
    var pceIndex;
    var pce;
    var sq;
    var tsq;
    var index;
    if (GameBoard.side == COLOURS.WHITE) {
        pceType = PIECES.wP;
        for (pceNum = 0; pceNum < GameBoard.pceNum[pceType]; ++pceNum) {
            sq = GameBoard.pList[PCEINDEX(pceType, pceNum)];

            if (SQOFFBOARD(sq + 9) == false && PieceCol[GameBoard.pieces[sq + 9]] == COLOURS.BLACK) {
                Move.AddWhitePawnCaptureMove(sq, sq + 9, GameBoard.pieces[sq + 9]);
            }
            if (SQOFFBOARD(sq + 11) == false && PieceCol[GameBoard.pieces[sq + 11]] == COLOURS.BLACK) {
                Move.AddWhitePawnCaptureMove(sq, sq + 11, GameBoard.pieces[sq + 11]);
            }

            if (GameBoard.enPas != SQUARES.NO_SQ) {
                if (sq + 9 == GameBoard.enPas) {
                    Move.AddEnPassantMove(Move.setMove(sq, sq + 9, PIECES.EMPTY, PIECES.EMPTY, MFLAGEP));
                }
                if (sq + 11 == GameBoard.enPas) {
                    Move.AddEnPassantMove(Move.setMove(sq, sq + 11, PIECES.EMPTY, PIECES.EMPTY, MFLAGEP));
                }
            }
        }

        pceType = PIECES.wN; // HACK to set for loop other pieces

    } else {
        pceType = PIECES.bP;
        for (pceNum = 0; pceNum < GameBoard.pceNum[pceType]; ++pceNum) {
            sq = GameBoard.pList[PCEINDEX(pceType, pceNum)];

            if (SQOFFBOARD(sq - 9) == false && PieceCol[GameBoard.pieces[sq - 9]] == COLOURS.WHITE) {
                Move.AddBlackPawnCaptureMove(sq, sq - 9, GameBoard.pieces[sq - 9]);
            }

            if (SQOFFBOARD(sq - 11) == false && PieceCol[GameBoard.pieces[sq - 11]] == COLOURS.WHITE) {
                Move.AddBlackPawnCaptureMove(sq, sq - 11, GameBoard.pieces[sq - 11]);
            }
            if (GameBoard.enPas != SQUARES.NO_SQ) {
                if (sq - 9 == GameBoard.enPas) {
                    Move.AddEnPassantMove(Move.setMove(sq, sq - 9, PIECES.EMPTY, PIECES.EMPTY, MFLAGEP));
                }
                if (sq - 11 == GameBoard.enPas) {
                    Move.AddEnPassantMove(Move.setMove(sq, sq - 11, PIECES.EMPTY, PIECES.EMPTY, MFLAGEP));
                }
            }
        }

        pceType = PIECES.bN; // HACK to set for loop other pieces
    }


    pceIndex = LoopSlideIndex[GameBoard.side];
    pce = LoopSlidePce[pceIndex++];
    while (pce != 0) {

        for (pceNum = 0; pceNum < GameBoard.pceNum[pce]; ++pceNum) {
            sq = GameBoard.pList[PCEINDEX(pce, pceNum)];

            for (index = 0; index < DirNum[pce]; ++index) {
                dir = PceDir[pce][index];
                t_sq = sq + dir;

                while (SQOFFBOARD(t_sq) == false) {

                    if (GameBoard.pieces[t_sq] != PIECES.EMPTY) {
                        if (PieceCol[GameBoard.pieces[t_sq]] == GameBoard.side ^ 1) {
                            Move.AddCaptureMove(Move.setMove(sq, t_sq, GameBoard.pieces[t_sq], PIECES.EMPTY, 0));
                        }
                        break;
                    }
                    t_sq += dir;
                }
            }
        }
        pce = LoopSlidePce[pceIndex++];
    }

    pceIndex = LoopNonSlideIndex[GameBoard.side];
    pce = LoopNonSlidePce[pceIndex++];

    while (pce != 0) {

        for (pceNum = 0; pceNum < GameBoard.pceNum[pce]; ++pceNum) {
            sq = GameBoard.pList[PCEINDEX(pce, pceNum)];

            for (index = 0; index < DirNum[pce]; ++index) {
                dir = PceDir[pce][index];
                t_sq = sq + dir;

                if (SQOFFBOARD(t_sq) == true) {
                    continue;
                }

                if (GameBoard.pieces[t_sq] != PIECES.EMPTY) {
                    if (PieceCol[GameBoard.pieces[t_sq]] == GameBoard.side ^ 1) {
                        Move.AddCaptureMove(Move.setMove(sq, t_sq, GameBoard.pieces[t_sq], PIECES.EMPTY, 0));
                    }
                    continue;
                }
            }
        }
        pce = LoopNonSlidePce[pceIndex++];
    }

}
