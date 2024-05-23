'use strict'
// I cant change levels for some reasons I would like for a review if it's possible

const FLAG = '🚩'
const MINE = `<img src="img/mines.png">`
const COVER = ''
const EMPTY = ''

const LIVE = '🧡'
const elSmiley = document.querySelector('.smiley')
var gBoard
var gGameSteps = []


var gBlownMinesIdxes = []

var gGame

var gLevel = {
    SIZE: 8,
    mines: 2,
    totalCell: 0
};

setGame()

var counterInterval = null

function initGame() {
    gBoard = createMat(gLevel.SIZE)

    gLevel.totalCell = gLevel.SIZE * gLevel.SIZE
    elSmiley.innerHTML = `<img src="img/smile.png">`

    renderBoard(gBoard)
   
    gGame.isOn = true

}

function levelDiff(level) {
    var levelClass
    var width
    const elGame = document.querySelector('.game')

    resetGame()

    switch (level) {
        case 1:
            gLevel.SIZE = 4
            levelClass = '.l1'
            width = 300
            gGame.livesCount = 1
            gLevel.mines = 0.4
            elGame.style.width = '550px'
            break;
        case 2:
            gLevel.SIZE = 8
            levelClass = '.l2'
            width = 460
            gGame.livesCount = 2
            gLevel.mines = 0.25
            elGame.style.width = '650px'
            break;
        case 3:
            gLevel.SIZE = 12
            levelClass = '.l3'
            width = 650
            gGame.livesCount = 3
            gLevel.mines = 0.2
            elGame.style.width = '840px'
            break;
        default: console.log(`Can't find level ${level}`);
    }

    const levelElements = document.querySelectorAll('.levels button')
    levelElements.forEach(element => {
        element.style.backgroundColor = null
    })
    document.querySelector(levelClass).style.backgroundColor = '#e07a36'

    initGame()
}

function renderBoard(board) {
    var strHTML = ''

    for (var i = 0; i < board.length; i++) {
        const currRow = board[i]
        strHTML += '<tr>'
        for (var j = 0; j < board[0].length; j++) {
            const currCell = currRow[j]
            var cellContent = setCellContent(currCell)

            var classAdd = ''
            if (currCell.clickedOnMine) classAdd = 'is-red'
            else if (currCell.isShown) {
                classAdd = ((i + j) % 2 === 0) ? 'is-shown' : 'is-gray'
            }
            if (!isNaN(cellContent)) classAdd += getNumColor(cellContent)
            if (!cellContent) cellContent = EMPTY

            if (gGame.isManualSet) classAdd += ' blank'

            strHTML += `<td id="${i}-${j}" class="cell ${classAdd}" 
            onclick="cellClicked(this, ${i}, ${j})" 
            oncontextmenu="cellMarked(this, ${i}, ${j})">${cellContent}
            </td>`
        }
        strHTML += '</tr>'
    }

    const elTable = document.querySelector('.table-game tbody')
    elTable.innerHTML = strHTML

    renderMinesLeft()
    renderLives()
}

function renderMinesLeft() {
    const elMinesInfo = document.querySelector('.mines span')
    elMinesInfo.innerText = gGame.minesLeft
}

function renderLives() {

    const livesIcons = LIVE.repeat(gGame.livesCount)
    const elMinesInfo = document.querySelector('.lives span')
    elMinesInfo.innerText = livesIcons

}

function setCellContent(cell) {
    var cellContent

    if (cell.isShown) {
        cellContent = (cell.isMine) ? MINE : cell.minesAroundCount
    } else {
        cellContent = (cell.isMarked) ? FLAG : COVER
    }

    return cellContent
}

function getNumColor(num) {
    var color = ''
    if (!num) return color

    switch (num) {
        case 1:
            color = ' text-green'
            break;
        case 2:
            color = ' text-blue'
            break;
        case 3:
            color = ' text-yellow'
            break;
        case 4:
            color = ' text-orange'
            break;
        case 5:
            color = ' text-red'
            break;

        default:
            console.log('To high number?', num);
            break;
    }

    return color
}


function setMinesNegsCount(board) {

    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[i].length; j++) {
            board[i][j].minesAroundCount = countContentNegs(board, i, j, 'isMine')
        }
    }
    return board
}

function cellClicked(elCell, rowIdx, colIdx) {

    if (!gGame.isOn) return

    if (!counterInterval) counterInterval = setInterval(setTimer, 1000)

    if (gBoard[rowIdx][colIdx].isShown) return
    gGameSteps.push([])
    expandCell(rowIdx, colIdx)
    checkVictory()
    renderBoard(gBoard)
    gGame.steps += 1
}

function setOnFirstCell(rowIdx, colIdx) {
    const buildRes = buildBoard(gBoard, 'isMine', gLevel.mines)
    gBoard = buildRes[0]
    gGame.minesLeft = buildRes[1]
    if (gBoard[rowIdx][colIdx].isMine) setOnFirstCell(rowIdx, colIdx)

    setMinesNegsCount(gBoard)
}

function expandCell(rowIdx, colIdx) {

    const currCell = gBoard[rowIdx][colIdx]
    if (currCell.isShown || currCell.isMarked) return

    currCell.isShown = true
    gGame.shownCount += 1

    gGameSteps[gGame.steps].push({ i: rowIdx, j: colIdx })

    if (currCell.isMine) {

        if (gGame.livesCount > 0) {
            gGame.livesCount -= 1
            gGame.minesLeft -= 1
            currCell.clickedOnMine = true
            return
        }

        gGame.livesCount -= 1
        currCell.clickedOnMine = true
        gameOver()
        return
    }

    if (!currCell.minesAroundCount) {
        expandShown(gBoard, rowIdx, colIdx)
    }
}

function expandShown(board, rowIdx, colIdx) {

    for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i >= board.length) continue

        for (var j = colIdx - 1; j <= colIdx + 1; j++) {
            if (j < 0 || j >= board[0].length) continue
            if (i === rowIdx && j === colIdx) continue
            expandCell(i, j)
        }
    }
}

function cellMarked(elCell, i, j) {
    if (!gGame.isOn) return
    if (!counterInterval) counterInterval = setInterval(setTimer, 1000)

    const currCell = gBoard[i][j]
    if (gGame.minesLeft <= 0 && !currCell.isMarked) return
    currCell.isMarked = !currCell.isMarked
    if (currCell.isMarked) {
        gLevel.markedCount += 1
        gGame.minesLeft -= 1
        if (currCell.isMine) gGame.minesHits += 1
    } else {
        gLevel.markedCount -= 1
        gGame.minesLeft += 1
        if (currCell.isMine) gGame.minesHits -= 1
    }
    checkVictory()
    renderBoard(gBoard)
}

function setTimer() {
    if (counterInterval) gGame.secsPassed += 1

    const elTimer = document.querySelector('.timer span')
    var secStr = gGame.secsPassed + ''
    if (secStr.length === 1) secStr = '00' + secStr
    else if (secStr.length === 2) secStr = '0' + secStr

    elTimer.innerText = secStr
}

function checkVictory() {
    if (gLevel.totalCell === (gGame.shownCount + gGame.minesHits)) {
        gGame.isWin = true
        gameOver()
    }
}


function gameOver() {
    gGame.isOn = false
    clearInterval(counterInterval)

    if (gGame.isWin) {
        elSmiley.innerHTML = `<img src="img/win.gif"><img class="fireworks" src="img/fireworks.png">` //😎
        setTimeout(() => document.querySelector('.fireworks').classList.add('hide'), 3000)
        var record = +localStorage.getItem('user_record');
        if (gGame.secsPassed < record) {
            document.querySelector('.score span').innerText = gGame.secsPassed
            localStorage.setItem('user_record', gGame.secsPassed);
        }

    } else {
        elSmiley.innerHTML = `<img src="img/lose.gif">` // 🤯
        buildBoard(gBoard, 'isShown', 1)
    }

}

function resetGame() {

    if (counterInterval) clearInterval(counterInterval)

    document.querySelector('.set-mines').style.backgroundColor = null

    counterInterval = null
    setTimer()
    initGame()
}

function setgGame() {
    gGame = {
        isOn: false,
        isWin: false,
        shownCount: 0,
        markedCount: 0,
        secsPassed: 0,
        minesHits: 0,
        minesLeft: 0,
        livesCount: parseInt(gLevel.SIZE / 4),
        steps: 0,
    }
}

