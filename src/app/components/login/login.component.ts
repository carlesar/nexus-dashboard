import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { NexusService } from '../../services/nexus.service';
declare var JSONEditor;
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loggingIn: boolean = false;
  hide: boolean = true;
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private nexus: NexusService
  ) { }

  ngOnInit() {
    this.form = this.fb.group({
      user: ['', Validators.required],
      password: ['', Validators.required]
    });

    let schema = `{
      "title": "Person",
      "type": "object",
      "properties": {
        "name": {
          "type": "string",
          "description": "First and Last name",
          "minLength": 4,
          "default": "Jeremy Dorn"
        },
        "age": {
          "type": "integer",
          "default": 25,
          "minimum": 18,
          "maximum": 99
        },
        "favorite_color": {
          "type": "string",
          "format": "color",
          "title": "favorite color",
          "default": "#ffa500"
        },
        "gender": {
          "type": "string",
          "enum": [
            "male",
            "female"
          ]
        },
        "location": {
          "type": "object",
          "title": "Location",
          "properties": {
            "city": {
              "type": "string",
              "default": "San Francisco"
            },
            "state": {
              "type": "string",
              "default": "CA"
            },
            "citystate": {
              "type": "string",
              "description": "This is generated automatically from the previous two fields",
              "template": "{{city}}, {{state}}",
              "watch": {
                "city": "location.city",
                "state": "location.state"
              }
            }
          }
        },
        "pets": {
          "type": "array",
          "format": "table",
          "title": "Pets",
          "uniqueItems": true,
          "items": {
            "type": "object",
            "title": "Pet",
            "properties": {
              "type": {
                "type": "string",
                "enum": [
                  "cat",
                  "dog",
                  "bird",
                  "reptile",
                  "other"
                ],
                "default": "dog"
              },
              "name": {
                "type": "string"
              }
            }
          },
          "default": [
            {
              "type": "dog",
              "name": "Walter"
            }
          ]
        }
      }
    }`

    let schema2 = {
      "properties": {
        "config_layer_ids": {
          "oneOf": [
            {
              "description": "Gets all configs layers with permissions.",
              "type": "null"
            },
            {
              "description": "Gets the config layers with passed ids.",
              "items": {
                "type": "string"
              },
              "type": "array"
            }
          ]
        },
        "type": {
          "default": "",
          "type": "string"
        }
      },
      "type": "object"
    }
    var editor = new JSONEditor(document.getElementById("editor_holder_getcodes"),{
      schema: schema2
    });
  }

  login() {
    this.loggingIn = true;
    let v = this.form.value;
    this.nexus.login(v.user, v.password).catch(() => {
      this.loggingIn = false;
    });
  }

}
