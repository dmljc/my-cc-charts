
import { IPublicTypeComponentMetadata, IPublicTypeSnippet } from '@alilc/lowcode-types';

const PipeFlowMeta: IPublicTypeComponentMetadata = {
  "componentName": "PipeFlow",
  "title": "PipeFlow",
  "docUrl": "",
  "screenshot": "",
  "devMode": "proCode",
  "npm": {
    "package": "my-cc-charts",
    "version": "0.1.0",
    "exportName": "PipeFlow",
    "main": "src/index.tsx",
    "destructuring": true,
    "subName": ""
  },
  "configure": {
    "props": [
      {
        "title": {
          "label": {
            "type": "i18n",
            "en-US": "names",
            "zh-CN": "names"
          }
        },
        "name": "names",
        "setter": {
          "componentName": "ArraySetter",
          "props": {
            "itemSetter": {
              "componentName": "StringSetter",
              "isRequired": false,
              "initialValue": ""
            }
          },
          "initialValue": []
        }
      },
      {
        "title": {
          "label": {
            "type": "i18n",
            "en-US": "data",
            "zh-CN": "data"
          }
        },
        "name": "data",
        "setter": {
          "componentName": "MixedSetter",
          "props": {
            "setters": [
              {
                "componentName": "ObjectSetter",
                "props": {
                  "config": {
                    "extraSetter": {
                      "componentName": "MixedSetter",
                      "props": {
                        "setters": []
                      },
                      "isRequired": false
                    }
                  }
                },
                "initialValue": {}
              },
              {
                "componentName": "ObjectSetter",
                "props": {
                  "config": {
                    "items": [
                      {
                        "title": {
                          "label": {
                            "type": "i18n",
                            "en-US": "name",
                            "zh-CN": "name"
                          }
                        },
                        "name": "name",
                        "setter": {
                          "componentName": "StringSetter",
                          "isRequired": true,
                          "initialValue": ""
                        }
                      },
                      {
                        "title": {
                          "label": {
                            "type": "i18n",
                            "en-US": "status",
                            "zh-CN": "status"
                          }
                        },
                        "name": "status",
                        "setter": {
                          "componentName": "MixedSetter",
                          "props": {
                            "setters": [
                              {
                                "componentName": "StringSetter",
                                "isRequired": false,
                                "initialValue": ""
                              },
                              {
                                "componentName": "NumberSetter",
                                "isRequired": false,
                                "initialValue": 0
                              },
                              {
                                "componentName": "BoolSetter",
                                "isRequired": false,
                                "initialValue": false
                              }
                            ]
                          },
                          "isRequired": true
                        }
                      }
                    ],
                    "extraSetter": {
                      "componentName": "MixedSetter",
                      "isRequired": false,
                      "props": {}
                    }
                  }
                }
              },
              {
                "componentName": "ArraySetter",
                "props": {
                  "itemSetter": {
                    "componentName": "ObjectSetter",
                    "props": {
                      "config": {
                        "items": [
                          {
                            "title": {
                              "label": {
                                "type": "i18n",
                                "en-US": "name",
                                "zh-CN": "name"
                              }
                            },
                            "name": "name",
                            "setter": {
                              "componentName": "StringSetter",
                              "isRequired": true,
                              "initialValue": ""
                            }
                          },
                          {
                            "title": {
                              "label": {
                                "type": "i18n",
                                "en-US": "status",
                                "zh-CN": "status"
                              }
                            },
                            "name": "status",
                            "setter": {
                              "componentName": "MixedSetter",
                              "props": {
                                "setters": [
                                  {
                                    "componentName": "StringSetter",
                                    "isRequired": false,
                                    "initialValue": ""
                                  },
                                  {
                                    "componentName": "NumberSetter",
                                    "isRequired": false,
                                    "initialValue": 0
                                  },
                                  {
                                    "componentName": "BoolSetter",
                                    "isRequired": false,
                                    "initialValue": false
                                  }
                                ]
                              },
                              "isRequired": true
                            }
                          }
                        ],
                        "extraSetter": {
                          "componentName": "MixedSetter",
                          "isRequired": false,
                          "props": {}
                        }
                      }
                    }
                  }
                },
                "initialValue": []
              }
            ]
          }
        }
      },
      {
        "title": {
          "label": {
            "type": "i18n",
            "en-US": "loaderId",
            "zh-CN": "loaderId"
          }
        },
        "name": "loaderId",
        "setter": {
          "componentName": "StringSetter",
          "isRequired": false,
          "initialValue": ""
        }
      },
      {
        "title": {
          "label": {
            "type": "i18n",
            "en-US": "groupPrefix",
            "zh-CN": "groupPrefix"
          }
        },
        "name": "groupPrefix",
        "setter": {
          "componentName": "StringSetter",
          "isRequired": false,
          "initialValue": ""
        }
      },
      {
        "title": {
          "label": {
            "type": "i18n",
            "en-US": "enabled",
            "zh-CN": "enabled"
          }
        },
        "name": "enabled",
        "setter": {
          "componentName": "BoolSetter",
          "isRequired": false,
          "initialValue": false
        }
      },
      {
        "title": {
          "label": {
            "type": "i18n",
            "en-US": "speedU",
            "zh-CN": "speedU"
          }
        },
        "name": "speedU",
        "setter": {
          "componentName": "NumberSetter",
          "isRequired": false,
          "initialValue": 0
        }
      },
      {
        "title": {
          "label": {
            "type": "i18n",
            "en-US": "speedV",
            "zh-CN": "speedV"
          }
        },
        "name": "speedV",
        "setter": {
          "componentName": "NumberSetter",
          "isRequired": false,
          "initialValue": 0
        }
      },
      {
        "title": {
          "label": {
            "type": "i18n",
            "en-US": "stopMode",
            "zh-CN": "stopMode"
          }
        },
        "name": "stopMode",
        "setter": {
          "componentName": "RadioGroupSetter",
          "props": {
            "dataSource": [
              {
                "label": "reset",
                "value": "reset"
              },
              {
                "label": "freeze",
                "value": "freeze"
              }
            ],
            "options": [
              {
                "label": "reset",
                "value": "reset"
              },
              {
                "label": "freeze",
                "value": "freeze"
              }
            ]
          },
          "initialValue": "reset"
        }
      },
      {
        "title": {
          "label": {
            "type": "i18n",
            "en-US": "updateFps",
            "zh-CN": "updateFps"
          }
        },
        "name": "updateFps",
        "setter": {
          "componentName": "NumberSetter",
          "isRequired": false,
          "initialValue": 0
        }
      },
      {
        "title": {
          "label": {
            "type": "i18n",
            "en-US": "highlightEnabled",
            "zh-CN": "highlightEnabled"
          }
        },
        "name": "highlightEnabled",
        "setter": {
          "componentName": "BoolSetter",
          "isRequired": false,
          "initialValue": false
        }
      },
      {
        "title": {
          "label": {
            "type": "i18n",
            "en-US": "highlightColor",
            "zh-CN": "highlightColor"
          }
        },
        "name": "highlightColor",
        "setter": {
          "componentName": "MixedSetter",
          "props": {
            "setters": [
              {
                "componentName": "StringSetter",
                "isRequired": false,
                "initialValue": ""
              },
              {
                "componentName": "NumberSetter",
                "isRequired": false,
                "initialValue": 0
              }
            ]
          }
        }
      },
      {
        "title": {
          "label": {
            "type": "i18n",
            "en-US": "highlightIntensity",
            "zh-CN": "highlightIntensity"
          }
        },
        "name": "highlightIntensity",
        "setter": {
          "componentName": "NumberSetter",
          "isRequired": false,
          "initialValue": 0
        }
      },
      {
        "title": {
          "label": {
            "type": "i18n",
            "en-US": "simulationEnabled",
            "zh-CN": "simulationEnabled"
          }
        },
        "name": "simulationEnabled",
        "setter": {
          "componentName": "BoolSetter",
          "isRequired": false,
          "initialValue": false
        }
      },
      {
        "title": {
          "label": {
            "type": "i18n",
            "en-US": "simulationInterval",
            "zh-CN": "simulationInterval"
          }
        },
        "name": "simulationInterval",
        "setter": {
          "componentName": "NumberSetter",
          "isRequired": false,
          "initialValue": 0
        }
      },
      {
        "title": {
          "label": {
            "type": "i18n",
            "en-US": "simulationRatio",
            "zh-CN": "simulationRatio"
          }
        },
        "name": "simulationRatio",
        "setter": {
          "componentName": "NumberSetter",
          "isRequired": false,
          "initialValue": 0
        }
      },
      {
        "title": {
          "label": {
            "type": "i18n",
            "en-US": "showDebugger",
            "zh-CN": "showDebugger"
          }
        },
        "name": "showDebugger",
        "setter": {
          "componentName": "BoolSetter",
          "isRequired": false,
          "initialValue": false
        }
      },
      {
        "title": {
          "label": {
            "type": "i18n",
            "en-US": "onStatusChange",
            "zh-CN": "onStatusChange"
          }
        },
        "name": "onStatusChange",
        "setter": {
          "componentName": "FunctionSetter"
        }
      },
      {
        "title": {
          "label": {
            "type": "i18n",
            "en-US": "__designMode",
            "zh-CN": "__designMode"
          }
        },
        "name": "__designMode",
        "setter": {
          "componentName": "StringSetter",
          "isRequired": false,
          "initialValue": ""
        }
      },
      {
        "title": {
          "label": {
            "type": "i18n",
            "en-US": "ref",
            "zh-CN": "ref"
          }
        },
        "name": "ref",
        "setter": {
          "componentName": "MixedSetter",
          "props": {
            "setters": [
              {
                "componentName": "FunctionSetter"
              },
              {
                "componentName": "ObjectSetter",
                "props": {
                  "config": {
                    "extraSetter": {
                      "componentName": "MixedSetter",
                      "isRequired": false,
                      "props": {}
                    }
                  }
                },
                "isRequired": false,
                "initialValue": {}
              }
            ]
          }
        }
      },
      {
        "title": {
          "label": {
            "type": "i18n",
            "en-US": "key",
            "zh-CN": "key"
          }
        },
        "name": "key",
        "setter": {
          "componentName": "MixedSetter",
          "props": {
            "setters": [
              {
                "componentName": "StringSetter",
                "isRequired": false,
                "initialValue": ""
              },
              {
                "componentName": "NumberSetter",
                "isRequired": false,
                "initialValue": 0
              }
            ]
          }
        }
      }
    ],
    "supports": {
      "style": true,
      "className": true
    },
    "component": {}
  }
};
const snippets: IPublicTypeSnippet[] = [
  {
    "title": "PipeFlow",
    "screenshot": "",
    "schema": {
      "componentName": "PipeFlow",
      "props": {}
    }
  }
];

export default {
  ...PipeFlowMeta,
  snippets
};
