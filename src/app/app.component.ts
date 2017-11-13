import { Component } from '@angular/core';

import { DialogComponent } from './dialog/dialog.component';
import {MatDialog, MatDialogRef} from '@angular/material';
import { Direct } from 'protractor/built/driverProviders';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent {

  private readonly grid_origin_x: number = 0;
  private readonly grid_origin_y: number = 0;
  private readonly grid_max_x: number = 4;
  private readonly grid_max_y: number = 4;
  public position: Position = null;

  public output: Array<string> = [];
  private executed_command_history: Array<Command> = [];

  currentFile: File;

  constructor(public dialog: MatDialog) {}
  
  public executeCommand(input: string): void {
    var command = this.getCommandObject(input);
    this.executed_command_history.push(command);
    if(command.valid){
      console.log('success! Command: ' + command.commandType + ',' + command.x_coord + ',' + command.y_coord + ',' + command.direction);
      
      switch (command.commandType){
        case CmdType.PLACE:
          this.position = new Position(command.x_coord, command.y_coord, command.direction);
          break;
        case CmdType.MOVE:
          this.position = this.moveToyForwards();
          break;
        case CmdType.LEFT:
          var newDirectionInt = Direction[this.position.direction] - 1;
          this.position = new Position(this.position.x_coord, this.position.y_coord, Direction[newDirectionInt < 0 ? 3 : newDirectionInt])
          break;
        case CmdType.RIGHT:
          this.position = new Position(this.position.x_coord, this.position.y_coord, Direction[(Direction[this.position.direction] + 1) % 4])
          break;
        case CmdType.REPORT:
          this.output.push(this.position.x_coord + ',' + this.position.y_coord + ',' + this.position.direction)
          break;
        default:
          break;
      }
    }
  }

  private moveToyForwards() : Position {
    switch (Direction[this.position.direction]){
      case Direction.NORTH:
        return new Position(this.position.x_coord, this.position.y_coord + 1, this.position.direction);
      case Direction.EAST:
        return new Position(this.position.x_coord + 1, this.position.y_coord, this.position.direction);
      case Direction.SOUTH:
        return new Position(this.position.x_coord, this.position.y_coord - 1, this.position.direction);
      case Direction.WEST:
        return new Position(this.position.x_coord - 1, this.position.y_coord, this.position.direction);
      default:
        return this.position;
  }

  private getCommandObject(input: string) : Command{
    var inputUpper = input.toUpperCase();

    if(inputUpper.substr(0, 5) == CmdType.PLACE){
      var params = inputUpper.split(',');
      params[0] = params[0].substr(params[0].length - 2, 2);

      if(!isNaN(+params[0]) && +params[0] <= this.grid_max_x && +params[0] >= this.grid_origin_x
        && !isNaN(+params[1]) && +params[1] <= this.grid_max_y && +params[1] >= this.grid_origin_y
        && params[2] in Direction){
          return new Command(input, true, CmdType.PLACE, +params[0], +params[1], params[2]);
      }else{
        return new Command(input, false);
      }
    }

    if(this.position != null){
      if(inputUpper == CmdType.LEFT || inputUpper == CmdType.RIGHT || inputUpper == CmdType.REPORT || (inputUpper == CmdType.MOVE && !this.isFacingEdge())){
        return new Command(input, true, inputUpper);
      }
    }
    
    return new Command(input, false);
  }

  private isFacingEdge(): boolean{
    if(this.position != null){
      switch (Direction[this.position.direction]){
        case Direction.NORTH:
          return this.position.y_coord >= this.grid_max_y;
        case Direction.EAST:
          return this.position.x_coord >= this.grid_max_x;
        case Direction.SOUTH:
          return this.position.y_coord <= this.grid_origin_y;
        case Direction.WEST:
          return this.position.x_coord <= this.grid_origin_x;
        default:
          return false;
      }
    }
    return false
  }

  public openDialog(): void {
    let dialogRef = this.dialog.open(DialogComponent, {
      width: '520px'
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
      
    });
  }

  public clearOutput(): void{
    this.output = [];
  }

  public clearExecutedCommands(): void{
    this.executed_command_history = [];
  }

  fileChange(event) {
    let fileList: FileList = event.target.files;
    if(fileList.length > 0) {
        this.currentFile = fileList[0];
    }
  }

  runFileCommands(){
    this.clearOutput();
    this.clearExecutedCommands();
    this.textCommand = "";
    this.position = null;

    var text = "";
    let reader = new FileReader();
    reader.onloadend = () => {
      reader.result.split("\n").forEach(element => {
        if(element.length > 0){
          this.executeCommand(element);
        }
      }); 
    }

    reader.readAsText(this.currentFile);   
  }
}


export class Command{

  input: string
  valid: boolean
  commandType: CmdType
  x_coord: number
  y_coord: number
  direction: Direction

  constructor(input: string, valid: boolean, commandType: CmdType = null, x: number = null, y: number = null, direction: Direction = null){
    this.input = input
    this.valid = valid
    this.commandType = commandType
    this.x_coord = x
    this.y_coord = y
    this.direction = direction
  }

}

export enum Direction {
  NORTH,
  EAST,
  SOUTH,
  WEST
}

export enum CmdType {
  PLACE = "PLACE",
  MOVE = "MOVE",
  LEFT = "LEFT",
  RIGHT = "RIGHT",
  REPORT = "REPORT"
}

export class Position {
  
    x_coord: number
    y_coord: number
    direction: Direction

    constructor(x: number, y: number, direction: Direction) {
        this.x_coord = x
        this.y_coord = y
        this.direction = direction
    }
}


