// Archivo mock para simular elementos de Discord.js

/**
 * Mock para comandos de Discord.js
 */
export class SlashCommandBuilderMock {
  private _name = '';
  private _description = '';
  private _options: Array<Record<string, any>> = [];
  
  public setName(name: string) {
    this._name = name;
    return this;
  }
  
  public setDescription(description: string) {
    this._description = description;
    return this;
  }
  
  public addStringOption(optionFn: Function) {
    const option: Record<string, any> = {
      type: 'string',
      setName: (name: string) => {
        option.name = name;
        return option;
      },
      setDescription: (description: string) => {
        option.description = description;
        return option;
      },
      setRequired: (required: boolean) => {
        option.required = required;
        return option;
      },
      setChoices: (choices: Array<Record<string, any>>) => {
        option.choices = choices;
        return option;
      },
      name: '',
      description: '',
      required: false,
      choices: [] as Array<Record<string, any>>
    };
    
    optionFn(option);
    this._options.push(option);
    return this;
  }
  
  public addIntegerOption(optionFn: Function) {
    const option = {
      type: 'integer',
      setName: (name: string) => {
        option.name = name;
        return option;
      },
      setDescription: (description: string) => {
        option.description = description;
        return option;
      },
      setRequired: (required: boolean) => {
        option.required = required;
        return option;
      },
      setMinValue: (value: number) => {
        option.minValue = value;
        return option;
      },
      setMaxValue: (value: number) => {
        option.maxValue = value;
        return option;
      },
      name: '',
      description: '',
      required: false,
      minValue: undefined as number | undefined,
      maxValue: undefined as number | undefined
    };
    
    optionFn(option);
    this._options.push(option);
    return this;
  }
  
  public addUserOption(optionFn: Function) {
    const option = {
      type: 'user',
      setName: (name: string) => {
        option.name = name;
        return option;
      },
      setDescription: (description: string) => {
        option.description = description;
        return option;
      },
      setRequired: (required: boolean) => {
        option.required = required;
        return option;
      },
      name: '',
      description: '',
      required: false
    };
    
    optionFn(option);
    this._options.push(option);
    return this;
  }
  
  public get name() {
    return this._name;
  }
  
  public get description() {
    return this._description;
  }
  
  public get options() {
    return this._options;
  }
}

/**
 * Mock para interacciones de Discord.js
 */
export class InteractionMock {
  public user: any;
  public guild: any;
  public options: any;
  public client: any;
  public channelId: string;
  public channel: any;
  public replied = false;
  public deferred = false;
  public readonly replies: any[] = [];
  
  constructor(options: any = {}) {
    this.user = options.user || { 
      id: 'mock-user-id',
      username: 'MockUser'
    };
    this.guild = options.guild || null;
    this.channelId = options.channelId || 'mock-channel-id';
    this.channel = options.channel || { 
      send: jest.fn().mockResolvedValue({}),
      id: this.channelId 
    };
    this.options = {
      getString: jest.fn().mockImplementation((name) => options.stringOptions?.[name] || null),
      getInteger: jest.fn().mockImplementation((name) => options.integerOptions?.[name] || null),
      getUser: jest.fn().mockImplementation((name) => options.userOptions?.[name] || null),
      getBoolean: jest.fn().mockImplementation((name) => options.booleanOptions?.[name] || null),
    };
    this.client = options.client || { 
      channels: {
        fetch: jest.fn().mockResolvedValue(this.channel)
      },
      users: {
        fetch: jest.fn().mockResolvedValue(this.user)
      }
    };
  }
  
  public async reply(content: any) {
    this.replied = true;
    const replyContent = typeof content === 'string' ? { content } : content;
    this.replies.push(replyContent);
    return {};
  }
  
  public async deferReply(options: any = {}) {
    this.deferred = true;
    return {};
  }
  
  public async editReply(content: any) {
    if (!this.deferred && !this.replied) {
      throw new Error('Cannot edit reply before replying or deferring.');
    }
    
    const replyContent = typeof content === 'string' ? { content } : content;
    this.replies.push(replyContent);
    return {};
  }
  
  public async followUp(content: any) {
    if (!this.replied && !this.deferred) {
      throw new Error('Cannot follow up before replying or deferring.');
    }
    
    const replyContent = typeof content === 'string' ? { content } : content;
    this.replies.push(replyContent);
    return {};
  }
}

// Mock para la clase Client de Discord.js
export class ClientMock {
  public user: any;
  public channels: any;
  public users: any;
  public guilds: any;
  public commands: any;
  public events: Record<string, Function[]> = {};
  
  constructor(options: any = {}) {
    this.user = options.user || { 
      id: 'mock-client-id',
      username: 'MockBot'
    };
    this.channels = {
      fetch: jest.fn().mockImplementation(async (id) => {
        return {
          id,
          send: jest.fn().mockResolvedValue({}),
          messages: {
            fetch: jest.fn().mockResolvedValue(new Map())
          }
        };
      })
    };
    this.users = {
      fetch: jest.fn().mockImplementation(async (id) => {
        return {
          id,
          username: 'MockUser',
          send: jest.fn().mockResolvedValue({})
        };
      })
    };
    this.guilds = {
      fetch: jest.fn().mockImplementation(async (id) => {
        return {
          id,
          name: 'MockGuild',
          members: {
            fetch: jest.fn().mockResolvedValue({
              id: 'mock-member-id',
              nickname: 'MockMember',
              user: { username: 'MockUser' }
            })
          },
          channels: {
            fetch: jest.fn().mockResolvedValue({
              id: 'mock-channel-id',
              send: jest.fn().mockResolvedValue({})
            })
          }
        };
      })
    };
    this.commands = {
      set: jest.fn().mockResolvedValue([]),
      fetch: jest.fn().mockResolvedValue(new Map())
    };
  }
  
  public login(token: string) {
    return Promise.resolve('mock-token');
  }
  
  public on(event: string, listener: Function) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
    return this;
  }
  
  public emit(event: string, ...args: any[]) {
    const handlers = this.events[event] || [];
    handlers.forEach(handler => handler(...args));
    return handlers.length > 0;
  }
  
  public destroy() {
    return Promise.resolve();
  }
}

// Re-exportar los mocks como si fueran módulos de discord.js
export default {
  SlashCommandBuilder: SlashCommandBuilderMock,
  CommandInteraction: InteractionMock,
  Client: ClientMock,
  GatewayIntentBits: {
    Guilds: 1,
    GuildMessages: 2,
    MessageContent: 4
  },
  PermissionFlagsBits: {
    Administrator: 8,
    ManageMessages: 16
  }
}; 