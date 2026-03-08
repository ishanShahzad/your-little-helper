import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { v2 as cloudinary } from 'cloudinary';
import { Hunt, HuntDocument, TaskType } from '../schemas/hunt.schema';
import { User, UserDocument } from '../schemas/user.schema';
import { GenerateHuntDto } from './dto/generate-hunt.dto';

@Injectable()
export class HuntsService {
  constructor(
    @InjectModel(Hunt.name) private huntModel: Model<HuntDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private configService: ConfigService,
  ) {
    cloudinary.config({
      cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
    });
  }

  // ── Character & Story ──────────────────────────────────────

  private readonly characters: Record<string, { name: string; emoji: string }> = {
    pirate: { name: 'Captain Goldbeard', emoji: '🏴‍☠️' },
    spy: { name: 'Agent B', emoji: '🕵️' },
    fairy: { name: 'Sparkle', emoji: '🧚' },
    unicorn: { name: 'Stardust', emoji: '🦄' },
    explorer: { name: 'Scout', emoji: '🧭' },
  };

  private generateStoryIntro(theme: string, character: string): string {
    const stories: Record<string, string> = {
      pirate: `${character} lost his treasure across the city! Four secret locations hold clues. Solve them all and the treasure will be yours!`,
      spy: `${character} has intercepted a coded message. Secret drops have been placed across the city. Your mission: decode them all before time runs out!`,
      fairy: `${character}'s magical wand has scattered fairy dust across the neighbourhood! Follow the sparkle trail to collect them all and restore the magic!`,
      unicorn: `${character} galloped through a rainbow portal and left magical hoofprints everywhere! Follow the rainbow trail to find them all!`,
      explorer: `${character} discovered an ancient map with mysterious markings! Each location holds a piece of the puzzle. Can your family solve it?`,
    };
    return stories[theme] || `${character} needs your help on an incredible adventure! Explore the city and complete challenges to save the day!`;
  }

  // ── Theme → POI Tags ──────────────────────────────────────

  private getThemeTags(theme: string): string {
    const map: Record<string, string> = {
      pirate: 'playground|fountain|monument|artwork',
      spy: 'bench|telephone|post_box|clock',
      fairy: 'garden|nature_reserve|flower_bed|tree',
      unicorn: 'park|meadow|playground|pitch',
      explorer: 'viewpoint|peak|memorial|ruins',
    };
    return map[theme] || 'playground|park|garden|bench';
  }

  private getAgeGroup(ages: number[]): 'toddler' | 'kid' | 'tween' {
    const avg = ages.length ? ages.reduce((a, b) => a + b, 0) / ages.length : 7;
    if (avg <= 4) return 'toddler';
    if (avg <= 9) return 'kid';
    return 'tween';
  }

  private buildAddress(tags: any): string {
    const parts: string[] = [];
    if (tags['addr:housenumber']) parts.push(tags['addr:housenumber']);
    if (tags['addr:street']) parts.push(tags['addr:street']);
    if (tags['addr:city']) parts.push(tags['addr:city']);
    if (tags['addr:postcode']) parts.push(tags['addr:postcode']);
    return parts.length > 0 ? parts.join(', ') : 'Address not available';
  }


  // ── Location-Aware Task Pool ──────────────────────────────

  private readonly locationTaskPool: Record<string, { taskType: TaskType; missionTitle: string; taskPrompt: string; taskAnswer?: string }[]> = {
    playground: [
      { taskType: TaskType.FIND_OBJECT, missionTitle: 'Find the tallest slide', taskPrompt: 'Find the tallest slide in this playground and stand at the bottom of it!' },
      { taskType: TaskType.COUNT_TASK, missionTitle: 'Swing count', taskPrompt: 'How many swings are in this playground? Count every single one!', taskAnswer: '' },
      { taskType: TaskType.PHOTO_TASK, missionTitle: 'Epic structure photo', taskPrompt: 'Take a photo of the biggest climbing structure from the ground looking up!' },
      { taskType: TaskType.SELFIE_TASK, missionTitle: 'Flying high', taskPrompt: 'Take a selfie while spinning on the roundabout or swinging on a swing — the blurrier the better!' },
      { taskType: TaskType.CHECKIN_TASK, missionTitle: 'Race to the top', taskPrompt: 'Race everyone in your group to the top of the climbing frame. Last one up is a rotten egg!' },
      { taskType: TaskType.ANSWER_RIDDLE, missionTitle: 'Playground riddle', taskPrompt: 'I go up and down but never move from my spot. Kids love me at recess. What am I?', taskAnswer: 'seesaw' },
      { taskType: TaskType.FIND_OBJECT, missionTitle: 'Find the spring rider', taskPrompt: 'Find a spring rider or rocking horse — sit on it and take a photo!' },
      { taskType: TaskType.COUNT_TASK, missionTitle: 'Slide count', taskPrompt: 'How many slides can you spot (include all sizes)? Ready, go!', taskAnswer: '' },
    ],
    park: [
      { taskType: TaskType.PHOTO_TASK, missionTitle: 'Hug a tree', taskPrompt: 'Find the widest tree you can and take a photo trying to hug it — extra points if you can\'t reach!' },
      { taskType: TaskType.FIND_OBJECT, missionTitle: 'Wildlife watch', taskPrompt: 'Spot ANY wildlife (bird, squirrel, duck, butterfly) and freeze like a statue when you see it!' },
      { taskType: TaskType.COUNT_TASK, missionTitle: 'Bench scout', taskPrompt: 'Count every bench you can see from where you\'re standing. Don\'t move your feet!', taskAnswer: '' },
      { taskType: TaskType.SELFIE_TASK, missionTitle: 'Greenest selfie', taskPrompt: 'Take a selfie with as much green nature as possible in the background. Compete for the leafiest shot!' },
      { taskType: TaskType.ANSWER_RIDDLE, missionTitle: 'Nature riddle', taskPrompt: 'I have rings but no fingers, I grow tall and give you shade. You can carve your name in me. What am I?', taskAnswer: 'tree' },
      { taskType: TaskType.CHECKIN_TASK, missionTitle: 'Nature walk', taskPrompt: 'Walk to the furthest corner of this park and find one natural thing that surprises you!' },
      { taskType: TaskType.FIND_OBJECT, missionTitle: 'Find a feather', taskPrompt: 'Find a feather, leaf with an unusual shape, or a stone with an interesting pattern!' },
      { taskType: TaskType.PHOTO_TASK, missionTitle: 'Shadow art', taskPrompt: 'Make a funny shadow pose on the ground and take a photo of it from above!' },
    ],
    cafe: [
      { taskType: TaskType.PHOTO_TASK, missionTitle: 'Most colourful treat', taskPrompt: 'Order something colourful and take a photo — the more colours the better!' },
      { taskType: TaskType.FIND_OBJECT, missionTitle: 'Menu mission', taskPrompt: 'Find the most unusual or funny item name on the menu and share it with the group!' },
      { taskType: TaskType.SELFIE_TASK, missionTitle: 'Treat selfie', taskPrompt: 'Take a selfie holding your treat with the biggest smile you can manage!' },
      { taskType: TaskType.ANSWER_RIDDLE, missionTitle: 'Flavour riddle', taskPrompt: 'I am yellow, cold, and rhyme with "lime." You squeeze me but I\'m not a stress ball. What am I?', taskAnswer: 'lemon' },
      { taskType: TaskType.COUNT_TASK, missionTitle: 'Seat count', taskPrompt: 'Count how many seats (chairs AND stools) are in this place. Estimate if it\'s huge!', taskAnswer: '' },
      { taskType: TaskType.CHECKIN_TASK, missionTitle: 'Napkin art', taskPrompt: 'Draw your adventure character on a napkin and show the whole group. Whose is best?' },
      { taskType: TaskType.PHOTO_TASK, missionTitle: 'Stack your treats', taskPrompt: 'Stack your cups, wrappers, or anything safe into a tiny tower and photograph it!' },
      { taskType: TaskType.FIND_OBJECT, missionTitle: 'Spot the chalk board', taskPrompt: 'Find the specials board or menu sign. Read today\'s special out loud in a dramatic announcer voice!' },
    ],
    library: [
      { taskType: TaskType.FIND_OBJECT, missionTitle: 'Theme-coloured cover', taskPrompt: 'Find a book whose cover colour matches the colour of your adventure theme. Hold it up!' },
      { taskType: TaskType.PHOTO_TASK, missionTitle: 'Rainbow shelf', taskPrompt: 'Find the most colourful bookshelf section and photograph it!' },
      { taskType: TaskType.COUNT_TASK, missionTitle: 'Shelf count', taskPrompt: 'Count every shelf visible from where you stand right now!', taskAnswer: '' },
      { taskType: TaskType.ANSWER_RIDDLE, missionTitle: 'Library riddle', taskPrompt: 'I have pages but I\'m not a notebook. I have a spine but I\'m not a skeleton. You open me but I\'m not a door. What am I?', taskAnswer: 'book' },
      { taskType: TaskType.SELFIE_TASK, missionTitle: 'Deep reader selfie', taskPrompt: 'Pick up the thickest book you can find. Take a selfie pretending you\'ve already read every word!' },
      { taskType: TaskType.FIND_OBJECT, missionTitle: 'Find a globe or map', taskPrompt: 'Find a globe, atlas, or large map anywhere in the library. Touch the country you\'d most like to visit!' },
      { taskType: TaskType.CHECKIN_TASK, missionTitle: 'Whisper challenge', taskPrompt: 'Whisper a funny sentence to each member of your group like a game of telephone. What comes out the other end?' },
      { taskType: TaskType.PHOTO_TASK, missionTitle: 'Tallest stack', taskPrompt: 'Stack 5 books into a tower (carefully!) and photograph it before they topple!' },
    ],
    bookshop: [
      { taskType: TaskType.FIND_OBJECT, missionTitle: 'Adventure book hunt', taskPrompt: 'Find a book with "adventure", "quest", "journey", or "secret" in the title!' },
      { taskType: TaskType.PHOTO_TASK, missionTitle: 'Best cover award', taskPrompt: 'Find the book with the most exciting-looking cover. Take a photo and explain why it would make an amazing movie!' },
      { taskType: TaskType.SELFIE_TASK, missionTitle: 'Bookworm selfie', taskPrompt: 'Take a selfie while pretending to be SO absorbed in a book you don\'t notice the camera!' },
      { taskType: TaskType.ANSWER_RIDDLE, missionTitle: 'Story riddle', taskPrompt: 'The more you take from me, the bigger I get. What am I?', taskAnswer: 'hole' },
      { taskType: TaskType.COUNT_TASK, missionTitle: 'Section count', taskPrompt: 'How many different sections or genres can you find in this shop? Count the signs!', taskAnswer: '' },
      { taskType: TaskType.FIND_OBJECT, missionTitle: 'Find a character like you', taskPrompt: 'Find a book whose main character shares something in common with someone in your group — same name, age, hair, or job!' },
      { taskType: TaskType.CHECKIN_TASK, missionTitle: 'Dramatic reading', taskPrompt: 'Open any book to a random page and read the first full sentence out loud in the most dramatic voice possible!' },
    ],
    toyshop: [
      { taskType: TaskType.FIND_OBJECT, missionTitle: 'Theme toy match', taskPrompt: 'Find a toy that best matches today\'s adventure theme. Make your case for why it fits!' },
      { taskType: TaskType.SELFIE_TASK, missionTitle: 'Stuffed animal squad', taskPrompt: 'Gather around the fluffiest stuffed animal you can find and take a group selfie with it!' },
      { taskType: TaskType.PHOTO_TASK, missionTitle: 'Wheels!', taskPrompt: 'Find a toy with wheels. Take a photo of it as if you\'re a car reviewer on TV!' },
      { taskType: TaskType.COUNT_TASK, missionTitle: 'Colour survey', taskPrompt: 'How many different colours of toy can you spot from where you\'re standing? No moving!', taskAnswer: '' },
      { taskType: TaskType.ANSWER_RIDDLE, missionTitle: 'Toy riddle', taskPrompt: 'Kids play with me, but I\'m not a sport. I have strings but I\'m not a guitar. What am I?', taskAnswer: 'puppet' },
      { taskType: TaskType.FIND_OBJECT, missionTitle: 'Find the tallest toy', taskPrompt: 'Find the tallest toy in the shop. Stand next to it and compare heights!' },
      { taskType: TaskType.CHECKIN_TASK, missionTitle: 'Robot walk', taskPrompt: 'Do your best robot impression and walk through this aisle. Everyone joins — no exceptions!' },
      { taskType: TaskType.PHOTO_TASK, missionTitle: 'Most ridiculous toy', taskPrompt: 'Find the most ridiculous or weirdest toy in the whole shop. Take a photo and award it the "What Were They Thinking?" prize!' },
    ],
    bakery: [
      { taskType: TaskType.PHOTO_TASK, missionTitle: 'Golden bake trophy', taskPrompt: 'Find the most perfectly golden-brown item in the display. Take a professional-looking food photo!' },
      { taskType: TaskType.FIND_OBJECT, missionTitle: 'Find your birthday cake', taskPrompt: 'Find the most over-the-top decorated cake or pastry. Whose birthday would this be perfect for?' },
      { taskType: TaskType.SELFIE_TASK, missionTitle: 'Head baker selfie', taskPrompt: 'Take a selfie looking like a professional baker who just baked EVERYTHING in this shop!' },
      { taskType: TaskType.COUNT_TASK, missionTitle: 'Pastry count', taskPrompt: 'Count how many different types of baked goods you can see on display!', taskAnswer: '' },
      { taskType: TaskType.ANSWER_RIDDLE, missionTitle: 'Baking riddle', taskPrompt: 'I puff up when I get hot, I\'m made of flour and yeast, and you slice me for sandwiches. What am I?', taskAnswer: 'bread' },
      { taskType: TaskType.FIND_OBJECT, missionTitle: 'Find the smallest treat', taskPrompt: 'Find the tiniest baked item available. Point it out and decide if it\'s still worth it!' },
      { taskType: TaskType.PHOTO_TASK, missionTitle: 'Artsy pastry shot', taskPrompt: 'Take an artistic flat-lay photo of your snack before eating it. Food photography time!' },
    ],
    landmark: [
      { taskType: TaskType.PHOTO_TASK, missionTitle: 'Creative angle shot', taskPrompt: 'Take a photo of this landmark from the most creative or unusual angle you can find!' },
      { taskType: TaskType.COUNT_TASK, missionTitle: 'Detail detective', taskPrompt: 'Count every decorative detail you can spot: carvings, plaques, symbols, or inscriptions!', taskAnswer: '' },
      { taskType: TaskType.SELFIE_TASK, missionTitle: 'Tourist trap selfie', taskPrompt: 'Take the most over-the-top tourist selfie you can manage — huge smiles, thumbs up, the works!' },
      { taskType: TaskType.FIND_OBJECT, missionTitle: 'Find the oldest thing', taskPrompt: 'Find the oldest-looking or most worn part of this landmark. What do you think it has seen in all those years?' },
      { taskType: TaskType.ANSWER_RIDDLE, missionTitle: 'Landmark riddle', taskPrompt: 'I stand still but I\'ve seen thousands of people. I\'ve been here before your grandparents were born. What am I?', taskAnswer: 'monument' },
      { taskType: TaskType.CHECKIN_TASK, missionTitle: 'Pose like the landmark', taskPrompt: 'Strike a pose that mirrors or matches the shape or mood of this landmark. Take a photo!' },
      { taskType: TaskType.FIND_OBJECT, missionTitle: 'Find an inscription', taskPrompt: 'Find any writing, date, or plaque on the landmark. Read it out loud to the group!' },
    ],
    community: [
      { taskType: TaskType.FIND_OBJECT, missionTitle: 'Notice board discovery', taskPrompt: 'Find the notice or events board. Spot the most interesting or funniest poster and read it to the group!' },
      { taskType: TaskType.PHOTO_TASK, missionTitle: 'Community spirit shot', taskPrompt: 'Take a photo of something that shows this place is important to the local community!' },
      { taskType: TaskType.SELFIE_TASK, missionTitle: 'Local hero selfie', taskPrompt: 'Take a selfie with the building in the background like you\'re the mayor of this neighbourhood!' },
      { taskType: TaskType.COUNT_TASK, missionTitle: 'Door count', taskPrompt: 'Count every door you can see from where you stand. How many entrances does this place have?', taskAnswer: '' },
      { taskType: TaskType.CHECKIN_TASK, missionTitle: 'Welcome wave', taskPrompt: 'Wave and say hello to the next person who walks past. Be as friendly as possible!' },
      { taskType: TaskType.ANSWER_RIDDLE, missionTitle: 'Community riddle', taskPrompt: 'I bring people together but I\'m not a party. I\'m free to use and open to all. What am I?', taskAnswer: 'community centre' },
    ],
    outdoor: [
      { taskType: TaskType.PHOTO_TASK, missionTitle: 'Hidden detail', taskPrompt: 'Take a photo of something tiny or easily overlooked that most people would walk straight past!' },
      { taskType: TaskType.FIND_OBJECT, missionTitle: 'Nature detective', taskPrompt: 'Find evidence that wildlife has been here: tracks, feathers, droppings, or nibbled leaves!' },
      { taskType: TaskType.COUNT_TASK, missionTitle: 'Tree species survey', taskPrompt: 'How many different species of trees can you identify? Look at leaf shape and bark!', taskAnswer: '' },
      { taskType: TaskType.SELFIE_TASK, missionTitle: 'Explorer selfie', taskPrompt: 'Take a selfie with the most interesting thing in the environment as your backdrop!' },
      { taskType: TaskType.ANSWER_RIDDLE, missionTitle: 'Outdoor riddle', taskPrompt: 'I fall in autumn, blow in winter, bud in spring, and dance in summer. What am I?', taskAnswer: 'leaf' },
      { taskType: TaskType.CHECKIN_TASK, missionTitle: 'Sit & observe', taskPrompt: 'Sit completely still for 1 minute and count how many different sounds you hear. Anything surprising?' },
      { taskType: TaskType.PHOTO_TASK, missionTitle: 'Sky frame', taskPrompt: 'Frame the sky through a gap between trees, buildings or your hands. Take the most artistic sky photo you can!' },
      { taskType: TaskType.FIND_OBJECT, missionTitle: 'Find a critter', taskPrompt: 'Find any small creature: ant, worm, beetle, snail. Observe it for 30 seconds. What is it doing?' },
    ],
    restaurant: [
      { taskType: TaskType.PHOTO_TASK, missionTitle: 'Menu masterpiece', taskPrompt: 'Find the most creative or funniest dish name on the menu and photograph it!' },
      { taskType: TaskType.FIND_OBJECT, missionTitle: 'Spot the chef\'s special', taskPrompt: 'Find the chef\'s special or most recommended dish. Ask a staff member what makes it special!' },
      { taskType: TaskType.SELFIE_TASK, missionTitle: 'Foodie selfie', taskPrompt: 'Take a selfie with your food or drink like a professional food blogger!' },
      { taskType: TaskType.COUNT_TASK, missionTitle: 'Table count', taskPrompt: 'How many tables can you count in this restaurant? Include indoor and outdoor!', taskAnswer: '' },
      { taskType: TaskType.ANSWER_RIDDLE, missionTitle: 'Food riddle', taskPrompt: 'I come in many shapes, can be thin or thick, you twirl me on a fork, and I\'m often with sauce. What am I?', taskAnswer: 'pasta' },
      { taskType: TaskType.CHECKIN_TASK, missionTitle: 'Rate the vibes', taskPrompt: 'Give this restaurant a "vibe score" from 1-10. What music is playing? What colours are on the walls? Discuss!' },
    ],
    museum: [
      { taskType: TaskType.FIND_OBJECT, missionTitle: 'Oldest exhibit', taskPrompt: 'Find the oldest item or exhibit on display. How old is it? Can you believe people used that?' },
      { taskType: TaskType.PHOTO_TASK, missionTitle: 'Museum mirror', taskPrompt: 'Find an exhibit and mimic its pose or shape. Take a photo side by side!' },
      { taskType: TaskType.SELFIE_TASK, missionTitle: 'Art critic selfie', taskPrompt: 'Stand next to a painting or exhibit and take a selfie with your best "deep thinker" face!' },
      { taskType: TaskType.COUNT_TASK, missionTitle: 'Room count', taskPrompt: 'How many different rooms or sections does this museum have? Walk around and count!', taskAnswer: '' },
      { taskType: TaskType.ANSWER_RIDDLE, missionTitle: 'Museum riddle', taskPrompt: 'I hang on walls but I\'m not a clock. I can be worth millions but can\'t buy anything. What am I?', taskAnswer: 'painting' },
      { taskType: TaskType.CHECKIN_TASK, missionTitle: 'Favourite exhibit', taskPrompt: 'Each person picks their absolute favourite exhibit. Explain WHY in 10 seconds — go!' },
    ],
    shop: [
      { taskType: TaskType.FIND_OBJECT, missionTitle: 'Bargain hunter', taskPrompt: 'Find the cheapest AND the most expensive item in the shop. What\'s the price difference?' },
      { taskType: TaskType.PHOTO_TASK, missionTitle: 'Window display art', taskPrompt: 'Take a photo of the most eye-catching display or arrangement in the shop!' },
      { taskType: TaskType.SELFIE_TASK, missionTitle: 'Shopping spree selfie', taskPrompt: 'Take a selfie pretending you just bought the most amazing thing ever!' },
      { taskType: TaskType.COUNT_TASK, missionTitle: 'Product variety', taskPrompt: 'How many completely different categories of products can you spot? Count them all!', taskAnswer: '' },
      { taskType: TaskType.ANSWER_RIDDLE, missionTitle: 'Shop riddle', taskPrompt: 'I have aisles but I\'m not a church. I have baskets but I\'m not a picnic. Everyone comes to me but I never leave. What am I?', taskAnswer: 'shop' },
      { taskType: TaskType.CHECKIN_TASK, missionTitle: 'Dream purchase', taskPrompt: 'If you could buy ONE thing from this shop as a gift, what would it be and for whom? Everyone shares!' },
    ],
    amusement: [
      { taskType: TaskType.FIND_OBJECT, missionTitle: 'Tallest ride', taskPrompt: 'Find the tallest or most thrilling-looking attraction. Would you dare to try it?' },
      { taskType: TaskType.PHOTO_TASK, missionTitle: 'Action shot', taskPrompt: 'Capture the most exciting moment — someone mid-ride, a spinning wheel, or a splash zone!' },
      { taskType: TaskType.SELFIE_TASK, missionTitle: 'Thrill seeker selfie', taskPrompt: 'Take a selfie with the most exciting attraction in the background. Show your bravest face!' },
      { taskType: TaskType.COUNT_TASK, missionTitle: 'Ride count', taskPrompt: 'How many different rides or attractions can you count from where you stand?', taskAnswer: '' },
      { taskType: TaskType.ANSWER_RIDDLE, missionTitle: 'Fun park riddle', taskPrompt: 'I go round and round but never get dizzy. I have horses but they never eat. What am I?', taskAnswer: 'carousel' },
      { taskType: TaskType.CHECKIN_TASK, missionTitle: 'Fun rating', taskPrompt: 'Everyone votes: what\'s the BEST thing here? Majority wins and you all go there next!' },
    ],
    entertainment: [
      { taskType: TaskType.FIND_OBJECT, missionTitle: 'Hidden gem', taskPrompt: 'Find something most visitors wouldn\'t notice — a poster, detail, or hidden corner!' },
      { taskType: TaskType.PHOTO_TASK, missionTitle: 'Lobby art', taskPrompt: 'Take a photo of the most interesting thing in the entrance or lobby area!' },
      { taskType: TaskType.SELFIE_TASK, missionTitle: 'Star selfie', taskPrompt: 'Take a selfie as if you\'re a movie star arriving at a premiere. Work the red carpet!' },
      { taskType: TaskType.COUNT_TASK, missionTitle: 'Screen or lane count', taskPrompt: 'How many screens, lanes, or activity areas does this place have?', taskAnswer: '' },
      { taskType: TaskType.ANSWER_RIDDLE, missionTitle: 'Entertainment riddle', taskPrompt: 'I have a big screen but I\'m not a phone. You eat popcorn watching me. What am I?', taskAnswer: 'cinema' },
      { taskType: TaskType.CHECKIN_TASK, missionTitle: 'Movie pitch', taskPrompt: 'In 30 seconds, pitch the plot of a movie about today\'s adventure. Best pitch wins!' },
    ],
  };

  // ── Theme-Based Fallback Task Pool ────────────────────────

  private readonly taskPool: Record<string, { taskType: TaskType; missionTitle: string; taskPrompt: string; taskAnswer?: string }[]> = {
    pirate: [
      { taskType: TaskType.FIND_OBJECT, missionTitle: 'Find the buried treasure', taskPrompt: 'Ahoy! Find something that could pass as buried treasure — a shiny stone, bright object, or unusual find!' },
      { taskType: TaskType.SELFIE_TASK, missionTitle: 'Pirate crew photo', taskPrompt: 'Every pirate needs a crew! Do your fiercest pirate "Arrr!" faces together and take a photo!' },
      { taskType: TaskType.COUNT_TASK, missionTitle: 'Count the cannons', taskPrompt: 'Count how many benches, bollards, or post-like objects you can spot from here. That\'s your cannon count!', taskAnswer: '' },
      { taskType: TaskType.PHOTO_TASK, missionTitle: 'Spot the X mark', taskPrompt: 'Find anything that looks like the letter X — crossing paths, fence patterns, signs. X marks the spot!' },
      { taskType: TaskType.ANSWER_RIDDLE, missionTitle: 'Pirate riddle', taskPrompt: 'I have 4 legs and a flat top. Pirates rest me on the ship deck. I can\'t walk but I hold treasure maps. What am I?', taskAnswer: 'table' },
      { taskType: TaskType.CHECKIN_TASK, missionTitle: 'Walk the plank', taskPrompt: 'Find a narrow path, kerb, or log and walk across it heel-to-toe without falling. That\'s walking the plank!' },
      { taskType: TaskType.PHOTO_TASK, missionTitle: 'Jolly Roger moment', taskPrompt: 'Find something black and white, or something that could double as a pirate flag. Take a photo!' },
      { taskType: TaskType.FIND_OBJECT, missionTitle: 'Find the crow\'s nest', taskPrompt: 'Find the highest point visible from here that a pirate lookout could use. Point it out and take a photo!' },
    ],
    spy: [
      { taskType: TaskType.PHOTO_TASK, missionTitle: 'Undercover surveillance', taskPrompt: 'Take a sneaky photo of something interesting without drawing attention. Spy mode activated!' },
      { taskType: TaskType.FIND_OBJECT, missionTitle: 'Spot the gadgets', taskPrompt: 'Find 3 everyday objects that could be used as spy gadgets in disguise. A good spy sees everything!' },
      { taskType: TaskType.COUNT_TASK, missionTitle: 'Suspect count', taskPrompt: 'How many people nearby are wearing something on their heads? That\'s your suspect count!', taskAnswer: '' },
      { taskType: TaskType.SELFIE_TASK, missionTitle: 'Undercover selfie', taskPrompt: 'Take a selfie looking as mysterious and suspicious as possible. Don\'t break character!' },
      { taskType: TaskType.ANSWER_RIDDLE, missionTitle: 'Spy code', taskPrompt: 'I have hands but cannot clap. I have a face but cannot smile. Spies check me constantly. What am I?', taskAnswer: 'clock' },
      { taskType: TaskType.CHECKIN_TASK, missionTitle: 'Silent approach', taskPrompt: 'Walk 20 steps in complete silence without making a sound. True stealth mode!' },
      { taskType: TaskType.PHOTO_TASK, missionTitle: 'Secret drop location', taskPrompt: 'Find a spot that would make a perfect secret message drop location. Photograph it without revealing where it is!' },
      { taskType: TaskType.FIND_OBJECT, missionTitle: 'Find a shadow', taskPrompt: 'Use your shadow as your disguise! Find a spot where your shadow looks the most dramatic or mysterious.' },
    ],
    fairy: [
      { taskType: TaskType.FIND_OBJECT, missionTitle: 'Fairy dust hunt', taskPrompt: 'Find the sparkliest or most beautiful natural thing nearby — a dewy leaf, shiny stone, or bright flower!' },
      { taskType: TaskType.SELFIE_TASK, missionTitle: 'Fairy ring dance', taskPrompt: 'Spin in a circle three times, then freeze and take a selfie. Did you find the fairy ring?' },
      { taskType: TaskType.PHOTO_TASK, missionTitle: 'Enchanted moment', taskPrompt: 'Find something that looks like it belongs in an enchanted fairy world. Take a magical photo!' },
      { taskType: TaskType.COUNT_TASK, missionTitle: 'Petal count', taskPrompt: 'Count every different coloured flower or plant you can spot from where you stand!', taskAnswer: '' },
      { taskType: TaskType.ANSWER_RIDDLE, missionTitle: 'Fairy riddle', taskPrompt: 'I am born in the morning, I dance in the breeze, I change colour in autumn and fall from the trees. What am I?', taskAnswer: 'leaf' },
      { taskType: TaskType.CHECKIN_TASK, missionTitle: 'Make a fairy wish', taskPrompt: 'Everyone closes their eyes, makes a secret wish, and whispers it to the wind. No peeking!' },
      { taskType: TaskType.PHOTO_TASK, missionTitle: 'Fairy door hunt', taskPrompt: 'Find a tiny gap, hole in a tree, or small space that could be a fairy door. Leave a tiny gift if you have one!' },
      { taskType: TaskType.FIND_OBJECT, missionTitle: 'Rainbow spotter', taskPrompt: 'Find something that contains ALL the colours of the rainbow in one place!' },
    ],
    unicorn: [
      { taskType: TaskType.FIND_OBJECT, missionTitle: 'Rainbow hunt', taskPrompt: 'Find something with at least 3 colours that could be part of a unicorn\'s rainbow world!' },
      { taskType: TaskType.SELFIE_TASK, missionTitle: 'Majestic unicorn pose', taskPrompt: 'Point one arm up as your horn, toss your hair, and take the most majestic unicorn selfie ever taken!' },
      { taskType: TaskType.PHOTO_TASK, missionTitle: 'Sparkle finder', taskPrompt: 'Find the sparkliest, shiniest, or most magical-looking thing nearby. That\'s unicorn energy!' },
      { taskType: TaskType.COUNT_TASK, missionTitle: 'Colour rainbow count', taskPrompt: 'Without moving your feet, how many different colours can you spot? Beat your record!', taskAnswer: '' },
      { taskType: TaskType.ANSWER_RIDDLE, missionTitle: 'Unicorn riddle', taskPrompt: 'I have a mane but I\'m not a lion. I have a horn but I\'m not a rhino. I poop rainbows (probably). What am I?', taskAnswer: 'unicorn' },
      { taskType: TaskType.CHECKIN_TASK, missionTitle: 'Magical gallop', taskPrompt: 'Everyone gallops like a unicorn in a big circle around this spot. Whoever does it most gracefully wins!' },
      { taskType: TaskType.PHOTO_TASK, missionTitle: 'Cloud spotting', taskPrompt: 'Look up! Find a cloud that looks like a unicorn, horse, or fantasy creature. Photograph it!' },
      { taskType: TaskType.FIND_OBJECT, missionTitle: 'Find something purple', taskPrompt: 'Unicorns love purple! Find the most vibrant purple or pink thing nearby and show the group!' },
    ],
    explorer: [
      { taskType: TaskType.PHOTO_TASK, missionTitle: 'New discovery', taskPrompt: 'Photograph something that looks like you\'re the first explorer to ever discover it. Give it a dramatic name!' },
      { taskType: TaskType.FIND_OBJECT, missionTitle: 'Field naturalist', taskPrompt: 'Find evidence of wildlife: tracks, feathers, nibbled plants, or burrows! Document your discovery!' },
      { taskType: TaskType.COUNT_TASK, missionTitle: 'Species survey', taskPrompt: 'How many different tree or plant species can you identify from where you stand?', taskAnswer: '' },
      { taskType: TaskType.SELFIE_TASK, missionTitle: 'Explorer\'s log photo', taskPrompt: 'Take a selfie with the most striking feature of this location as your backdrop. Log it for posterity!' },
      { taskType: TaskType.ANSWER_RIDDLE, missionTitle: 'Explorer\'s riddle', taskPrompt: 'I always point north but I\'m not a finger. Sailors loved me before GPS. What am I?', taskAnswer: 'compass' },
      { taskType: TaskType.CHECKIN_TASK, missionTitle: 'Sketch the map', taskPrompt: 'Everyone draws a mini map of this area on their hand or in the air. Compare — whose is most accurate?' },
      { taskType: TaskType.PHOTO_TASK, missionTitle: 'Horizon shot', taskPrompt: 'Find the furthest point you can see from here. Photograph it like a real expedition photo!' },
      { taskType: TaskType.FIND_OBJECT, missionTitle: 'Find north', taskPrompt: 'Use the sun\'s position, shadows, or any landmark to figure out which direction is north. Point to it!' },
    ],
  };

  private assignTask(
    theme: string,
    locationType: string,
    stopIndex: number,
    ageGroup: string,
  ): { taskType: TaskType; missionTitle: string; taskPrompt: string; taskAnswer?: string } {
    // Prefer location-aware tasks; fall back to theme-based pool
    const locationPool = this.locationTaskPool[locationType];
    const themePool = this.taskPool[theme] || this.taskPool['explorer'];
    const pool = locationPool && locationPool.length > 0 ? locationPool : themePool;

    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const task = shuffled[stopIndex % shuffled.length];

    if (ageGroup === 'toddler') {
      return {
        ...task,
        taskPrompt: task.taskPrompt.replace(/Find|Identify|Count/g, (m) =>
          m === 'Find' ? 'Can you find' : m === 'Identify' ? 'Can you spot' : 'How many',
        ) + ' 🎉',
      };
    }
    return task;
  }

  // ── Clue Generation ───────────────────────────────────────

  private generateClue(theme: string, stopName: string, ageGroup: string): string {
    const templates: Record<string, Record<string, string[]>> = {
      pirate: {
        toddler: [`Look! ${stopName} has a treasure! Can you find it?`, `Captain says go to ${stopName}! 🏴‍☠️`],
        kid: [`Arrr! Captain Goldbeard buried treasure near ${stopName}!`, `X marks the spot at ${stopName}, matey!`, `The treasure map points to ${stopName}!`],
        tween: [`Intelligence reports treasure coordinates at ${stopName}. Intercept and retrieve.`, `${stopName} — the last known location of the Golden Doubloon.`],
      },
      spy: {
        toddler: [`Shhh! Go quietly to ${stopName}! 🤫`, `The secret is at ${stopName}!`],
        kid: [`Agent B's intel says the drop is at ${stopName}.`, `Your mission: infiltrate ${stopName}.`],
        tween: [`Classified intel points to ${stopName}. Approach with caution.`, `Priority Alpha — rendezvous at ${stopName}. Sweep for surveillance.`],
      },
      fairy: {
        toddler: [`Look for sparkles at ${stopName}! ✨`, `Sparkle flew to ${stopName}!`],
        kid: [`Sparkle left fairy dust at ${stopName}!`, `The enchanted ${stopName} awaits!`],
        tween: [`Ancient fairy runes glow brightest near ${stopName}.`, `The fairy council has hidden a charm at ${stopName}.`],
      },
      unicorn: {
        toddler: [`Rainbow at ${stopName}! Let's go! 🌈`, `Stardust is at ${stopName}!`],
        kid: [`Stardust galloped through ${stopName}!`, `A rainbow trail leads to ${stopName}!`],
        tween: [`Chromatic energy readings spike near ${stopName}.`, `${stopName} — portal nexus detected.`],
      },
      explorer: {
        toddler: [`Let's explore ${stopName}! 🧭`, `Something cool is at ${stopName}!`],
        kid: [`Scout spotted something at ${stopName}!`, `Your compass points to ${stopName}!`],
        tween: [`Uncharted territory detected at ${stopName}.`, `${stopName} — marked on the ancient expedition map.`],
      },
    };
    const themeClues = templates[theme]?.[ageGroup] || templates[theme]?.kid || [`Head to ${stopName}!`];
    return themeClues[Math.floor(Math.random() * themeClues.length)];
  }

  // ── Stop Count by Duration ────────────────────────────────

  private getStopCount(durationMinutes: number): number {
    if (durationMinutes <= 30) return 3;
    if (durationMinutes <= 60) return 4;
    if (durationMinutes <= 90) return 5;
    return 6;
  }
  // ── Overpass Retry Helper ─────────────────────────────────

  private async fetchFromOverpass(query: string, primaryUrl: string, fallbackUrls: string[], timeout: number): Promise<any> {
    const urls = [primaryUrl, ...fallbackUrls];

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      try {
        console.log(`[Overpass] Trying ${url.includes('kumi') ? 'kumi.systems' : url.includes('openstreetmap.ru') ? 'openstreetmap.ru' : 'overpass-api.de'}...`);
        const { data } = await axios.post(url, `data=${encodeURIComponent(query)}`, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          timeout,
        });
        console.log(`[Overpass] Success! Got ${data.elements?.length || 0} elements`);
        return data;
      } catch (err: any) {
        console.warn(`[Overpass] ${url} failed:`, err.response?.status || err.code);
        if (i === urls.length - 1) {
          // Last attempt failed
          throw err;
        }
        // Try next URL
      }
    }
  }
  // ── Google Places API Helper ──────────────────────────────

  private async fetchPOIsFromGooglePlaces(lat: number, lng: number, radius: number): Promise<any[]> {
    const googleApiKey = this.configService.get('GOOGLE_MAPS_API_KEY');
    if (!googleApiKey || googleApiKey === 'your-google-maps-api-key-here') {
      console.log('[Google Places] No API key configured, skipping');
      return [];
    }

    try {
      // Google Places Nearby Search - comprehensive types for diverse hunts
      const types = [
        // Outdoor & nature
        'park',
        'playground',
        // Culture & attractions
        'tourist_attraction',
        'museum',
        'art_gallery',
        'library',
        'aquarium',
        'zoo',
        // Food & drink
        'restaurant',
        'cafe',
        'bakery',
        'ice_cream_shop',
        // Shopping & fun
        'store',
        'pet_store',
        'book_store',
        'shopping_mall',
        // Entertainment
        'bowling_alley',
        'movie_theater',
        'amusement_park',
      ];

      const allPlaces: any[] = [];
      const seenPlaceIds = new Set<string>();

      // Fetch places for each type (batch to avoid rate limits)
      for (const type of types) {
        try {
          const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json`;
          const params = {
            location: `${lat},${lng}`,
            radius: radius.toString(),
            type,
            key: googleApiKey,
          };

          const { data } = await axios.get(url, { params, timeout: 10000 });

          if (data.status === 'OK' && data.results) {
            for (const place of data.results) {
              if (!seenPlaceIds.has(place.place_id)) {
                seenPlaceIds.add(place.place_id);
                allPlaces.push(place);
              }
            }
          }
        } catch (err) {
          console.warn(`[Google Places] Failed to fetch ${type}:`, err.message);
        }
      }

      console.log(`[Google Places] Found ${allPlaces.length} unique places`);

      // Convert Google Places format to our POI format
      return allPlaces.map(place => {
        const t = place.types || [];
        return {
          lat: place.geometry?.location?.lat,
          lon: place.geometry?.location?.lng,
          tags: {
            name: place.name,
            leisure: t.includes('park') ? 'park' :
                     t.includes('playground') ? 'playground' :
                     t.includes('amusement_park') ? 'amusement_park' : undefined,
            tourism: t.includes('tourist_attraction') ? 'attraction' :
                     t.includes('museum') ? 'museum' :
                     t.includes('art_gallery') ? 'gallery' :
                     t.includes('aquarium') ? 'aquarium' :
                     t.includes('zoo') ? 'zoo' : undefined,
            amenity: t.includes('restaurant') ? 'restaurant' :
                     t.includes('cafe') ? 'cafe' :
                     t.includes('library') ? 'library' :
                     t.includes('ice_cream_shop') ? 'ice_cream' :
                     t.includes('bowling_alley') ? 'bowling_alley' :
                     t.includes('movie_theater') ? 'cinema' : undefined,
            shop: t.includes('bakery') ? 'bakery' :
                  t.includes('pet_store') ? 'pet' :
                  t.includes('book_store') ? 'books' :
                  t.includes('shopping_mall') ? 'mall' :
                  t.includes('store') ? 'general' : undefined,
            'addr:street': place.vicinity,
          },
          source: 'google',
          rating: place.rating,
          user_ratings_total: place.user_ratings_total,
          priceLevel: place.price_level || 0,
        };
      });
    } catch (err: any) {
      console.error('[Google Places] Error:', err.message);
      return [];
    }
  }
  // ── POI Scoring & Filtering ───────────────────────────────

  private scorePOI(poi: any, userLat: number, userLng: number, previousVisits: Set<string>): number {
    let score = 0;
    const tags = poi.tags || {};

    // High priority — outdoor family fun (10 points)
    if (tags.leisure === 'playground') score += 10;
    else if (tags.leisure === 'park') score += 10;
    else if (tags.leisure === 'amusement_park' || tags.leisure === 'water_park') score += 10;
    else if (tags.tourism === 'attraction') score += 10;
    else if (tags.tourism === 'viewpoint') score += 10;
    else if (tags.tourism === 'zoo' || tags.tourism === 'aquarium') score += 10;
    else if (tags.historic === 'monument' || tags.historic === 'castle') score += 10;
    else if (tags.historic === 'memorial') score += 10;

    // Medium priority — culture, treats, entertainment (7-8 points)
    else if (tags.tourism === 'museum' || tags.tourism === 'gallery') score += 8;
    else if (tags.amenity === 'fountain') score += 7;
    else if (tags.leisure === 'garden') score += 7;
    else if (tags.amenity === 'library') score += 7;
    else if (tags.tourism === 'artwork') score += 7;
    else if (tags.historic === 'statue') score += 7;
    else if (tags.shop === 'ice_cream') score += 8;
    else if (tags.amenity === 'bowling_alley' || tags.amenity === 'cinema') score += 7;

    // Standard priority — shops, food, community (5-6 points)
    else if (tags.amenity === 'restaurant' || tags.amenity === 'fast_food') score += 6;
    else if (tags.amenity === 'cafe' || tags.amenity === 'ice_cream') score += 6;
    else if (tags.shop === 'bakery') score += 6;
    else if (tags.shop === 'toys') score += 6;
    else if (tags.shop === 'books' || tags.shop === 'pet') score += 6;
    else if (tags.shop === 'chocolate' || tags.shop === 'confectionery') score += 5;
    else if (tags.shop) score += 4; // Any other shop
    else if (tags.amenity === 'community_centre' || tags.amenity === 'arts_centre') score += 5;

    // Bonus for having a name (but not required)
    if (tags.name) score += 3;

    // Bonus for Google rating
    if (poi.rating && poi.rating >= 4.0) score += 3;
    if (poi.user_ratings_total && poi.user_ratings_total > 50) score += 2;

    // Bonus for not visited recently (only if has name)
    if (tags.name && !previousVisits.has(tags.name)) score += 5;

    // Distance scoring (prefer 200-800m range)
    const dist = this.haversineDistance(userLat, userLng, poi.lat, poi.lon);
    if (dist < 100) score -= 3; // Too close (reduced penalty)
    else if (dist < 200) score -= 1;
    else if (dist >= 200 && dist <= 800) score += 3; // Ideal range
    else if (dist > 1500) score -= 3; // Too far (reduced penalty)

    return score;
  }

  private haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000; // Earth radius in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
              Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private isValidPOI(poi: any): boolean {
    const tags = poi.tags || {};

    // Must have coordinates (handle both node and way elements)
    if (!poi.lat && !poi.center?.lat) return false;
    if (!poi.lon && !poi.center?.lon) return false;
    
    // Normalize coordinates for ways
    if (!poi.lat && poi.center) {
      poi.lat = poi.center.lat;
      poi.lon = poi.center.lon;
    }

    // Exclude obvious bad locations
    if (tags.building === 'residential') return false;
    if (tags.building === 'house') return false;
    if (tags.building === 'apartments') return false;
    if (tags.landuse === 'residential') return false;
    if (tags.access === 'private') return false;

    // Exclude roads/highways (but allow paths and footways)
    if (tags.highway && !['footway', 'path', 'pedestrian'].includes(tags.highway)) return false;

    // Must have at least one useful tag
    const hasUsefulTag = tags.leisure || tags.tourism || tags.historic ||
                         tags.amenity || tags.shop || tags.natural;

    return hasUsefulTag;
  }

  private orderPOIsIntoRoute(pois: any[], startLat: number, startLng: number): any[] {
    if (pois.length === 0) return [];

    const ordered: any[] = [];
    let currentLat = startLat;
    let currentLng = startLng;
    const remaining = [...pois];

    while (remaining.length > 0) {
      // Find POIs within ideal range (200-800m)
      const candidates = remaining
        .map(poi => ({
          poi,
          dist: this.haversineDistance(currentLat, currentLng, poi.lat, poi.lon)
        }))
        .filter(({ dist }) => dist >= 200 && dist <= 800)
        .sort((a, b) => a.dist - b.dist);

      let selected: any;
      if (candidates.length > 0) {
        // Pick from ideal range
        selected = candidates[0].poi;
      } else {
        // No POI in ideal range, pick closest
        const closest = remaining
          .map(poi => ({
            poi,
            dist: this.haversineDistance(currentLat, currentLng, poi.lat, poi.lon)
          }))
          .sort((a, b) => a.dist - b.dist)[0];
        selected = closest.poi;
      }

      ordered.push(selected);
      remaining.splice(remaining.indexOf(selected), 1);
      currentLat = selected.lat;
      currentLng = selected.lon;
    }

    return ordered;
  }

  private getLocationType(poi: any): string {
    const tags = poi.tags || {};
    if (tags.leisure === 'playground') return 'playground';
    if (tags.leisure === 'park' || tags.leisure === 'garden') return 'park';
    if (tags.leisure === 'amusement_park' || tags.leisure === 'water_park' || tags.leisure === 'miniature_golf') return 'amusement';
    if (tags.amenity === 'fountain') return 'fountain';
    if (tags.tourism === 'attraction' || tags.tourism === 'viewpoint') return 'landmark';
    if (tags.tourism === 'museum' || tags.tourism === 'gallery' || tags.tourism === 'aquarium') return 'museum';
    if (tags.tourism === 'zoo') return 'amusement';
    if (tags.historic) return 'landmark';
    if (tags.amenity === 'restaurant' || tags.amenity === 'fast_food') return 'restaurant';
    if (tags.amenity === 'cafe' || tags.amenity === 'ice_cream') return 'cafe';
    if (tags.amenity === 'library') return 'library';
    if (tags.amenity === 'cinema' || tags.amenity === 'bowling_alley' || tags.amenity === 'theatre') return 'entertainment';
    if (tags.amenity === 'community_centre' || tags.amenity === 'arts_centre') return 'community';
    if (tags.shop === 'bakery') return 'bakery';
    if (tags.shop === 'toys') return 'toyshop';
    if (tags.shop === 'books') return 'bookshop';
    if (tags.shop === 'ice_cream') return 'cafe';
    if (tags.shop) return 'shop';
    return 'outdoor';
  }

  // ── Food POI Detection ─────────────────────────────────────

  private isFoodPOI(poi: any): boolean {
    const tags = poi.tags || {};
    const foodAmenities = ['restaurant', 'fast_food', 'cafe', 'ice_cream'];
    const foodShops = ['bakery', 'ice_cream', 'chocolate', 'confectionery'];
    return foodAmenities.includes(tags.amenity) || foodShops.includes(tags.shop);
  }

  // ── Budget & Cost Estimation ──────────────────────────────

  private isFreeLocation(poi: any): boolean {
    const tags = poi.tags || {};
    const freeTags = [
      'park', 'playground', 'garden', 'viewpoint',
      'monument', 'memorial', 'fountain', 'pitch',
      'nature_reserve', 'beach', 'picnic_site'
    ];
    
    return freeTags.some(tag =>
      tags.leisure === tag ||
      tags.tourism === tag ||
      tags.historic === tag ||
      tags.natural === tag
    );
  }

  private estimateStopCost(poi: any): number {
    const tags = poi.tags || {};
    
    // Free locations
    if (this.isFreeLocation(poi)) return 0;
    
    // Use Google Places price level if available (1-4)
    if (poi.priceLevel) {
      // Convert to dollar amount
      const priceMap: Record<number, number> = { 1: 5, 2: 10, 3: 15, 4: 20 };
      return priceMap[poi.priceLevel] || 10;
    }
    
    // Estimate based on type
    if (tags.shop === 'ice_cream') return 5;
    if (tags.shop === 'bakery') return 8;
    if (tags.amenity === 'cafe' || tags.amenity === 'ice_cream') return 10;
    if (tags.amenity === 'restaurant') return 20;
    if (tags.amenity === 'fast_food') return 12;
    if (tags.shop === 'toys') return 15;
    if (tags.shop === 'books') return 15;
    if (tags.shop === 'chocolate' || tags.shop === 'confectionery') return 8;
    if (tags.shop === 'pet') return 10;
    if (tags.shop === 'mall') return 20;
    if (tags.shop) return 10; // Generic shop
    if (tags.tourism === 'museum' || tags.tourism === 'gallery') return 12;
    if (tags.tourism === 'zoo' || tags.tourism === 'aquarium') return 18;
    if (tags.tourism === 'attraction') return 12;
    if (tags.amenity === 'bowling_alley') return 15;
    if (tags.amenity === 'cinema') return 15;
    if (tags.leisure === 'amusement_park' || tags.leisure === 'water_park') return 25;

    return 0; // Default to free if unknown
  }

  private filterPOIsByBudget(pois: any[], budget: number, stopCount: number): any[] {
    // Categorize POIs by cost
    const free = pois.filter(p => this.isFreeLocation(p));
    const lowCost = pois.filter(p => {
      const cost = this.estimateStopCost(p);
      return cost > 0 && cost <= 10;
    });
    const mediumCost = pois.filter(p => {
      const cost = this.estimateStopCost(p);
      return cost > 10 && cost <= 20;
    });
    const highCost = pois.filter(p => {
      const cost = this.estimateStopCost(p);
      return cost > 20;
    });
    
    let selected: any[] = [];
    
    if (budget <= 10) {
      // Very low budget: mostly free, maybe 1 low-cost
      selected = [
        ...free.slice(0, stopCount - 1),
        ...lowCost.slice(0, 1)
      ];
    } else if (budget <= 30) {
      // Low budget: mix of free and low-cost
      const freeCount = Math.ceil(stopCount * 0.6);
      const lowCount = stopCount - freeCount;
      selected = [
        ...free.slice(0, freeCount),
        ...lowCost.slice(0, lowCount)
      ];
    } else if (budget <= 50) {
      // Medium budget: can include some medium-cost
      const freeCount = Math.ceil(stopCount * 0.4);
      const lowCount = Math.ceil(stopCount * 0.3);
      const medCount = stopCount - freeCount - lowCount;
      selected = [
        ...free.slice(0, freeCount),
        ...lowCost.slice(0, lowCount),
        ...mediumCost.slice(0, medCount)
      ];
    } else {
      // High budget: all options available
      selected = pois.slice(0, stopCount);
    }
    
    // Ensure we have enough POIs
    if (selected.length < stopCount) {
      // Fill with any remaining POIs
      const remaining = pois.filter(p => !selected.includes(p));
      selected = [...selected, ...remaining.slice(0, stopCount - selected.length)];
    }
    
    return selected.slice(0, stopCount);
  }

  // ── Transport Mode ────────────────────────────────────────

  private getRadiusByTransport(durationMinutes: number, transportMode: string): number {
    if (transportMode === 'car') {
      // Car can cover more distance
      if (durationMinutes <= 30) return 3000;  // 3km
      if (durationMinutes <= 60) return 5000;  // 5km
      if (durationMinutes <= 90) return 6000;  // 6km
      return 7000; // 7km
    } else {
      // Walking - more conservative
      if (durationMinutes <= 30) return 800;   // 800m
      if (durationMinutes <= 60) return 1500;  // 1.5km
      if (durationMinutes <= 90) return 2000;  // 2km
      return 2500; // 2.5km
    }
  }

  // ── Environment Filtering ─────────────────────────────────

  private categorizeByEnvironment(poi: any): 'indoor' | 'outdoor' | 'mixed' {
    const tags = poi.tags || {};
    
    // Outdoor locations
    const outdoor = [
      'park', 'playground', 'garden', 'viewpoint',
      'pitch', 'nature_reserve', 'beach', 'picnic_site'
    ];
    if (outdoor.some(t => tags.leisure === t || tags.tourism === t || tags.natural === t)) {
      return 'outdoor';
    }
    
    // Indoor locations
    const indoor = [
      'museum', 'library', 'cinema', 'theatre',
      'gallery', 'aquarium', 'bowling_alley', 'arts_centre'
    ];
    if (indoor.some(t => tags.tourism === t || tags.amenity === t)) {
      return 'indoor';
    }

    // Mixed (can be enjoyed in any weather)
    const mixed = [
      'cafe', 'bakery', 'ice_cream', 'toys', 'books',
      'restaurant', 'fast_food', 'pet', 'chocolate', 'confectionery',
      'clothes', 'gift', 'supermarket', 'mall', 'general',
      'community_centre'
    ];
    if (mixed.some(t => tags.shop === t || tags.amenity === t)) {
      return 'mixed';
    }
    
    // Default to outdoor
    return 'outdoor';
  }

  private filterByEnvironment(pois: any[], preference: string): any[] {
    if (preference === 'indoor') {
      return pois.filter(p => {
        const env = this.categorizeByEnvironment(p);
        return env === 'indoor' || env === 'mixed';
      });
    } else if (preference === 'outdoor') {
      return pois.filter(p => {
        const env = this.categorizeByEnvironment(p);
        return env === 'outdoor' || env === 'mixed';
      });
    }
    // 'mixed' - return all
    return pois;
  }

  // ── Main Generate ─────────────────────────────────────────

  async generate(userId: string, dto: GenerateHuntDto) {
    const user = await this.userModel.findById(userId).lean();
    if (!user) throw new NotFoundException('User not found');

    const completedHunts = (user.history || []).length;
    if (completedHunts >= 1 && user.subscription?.plan === 'free') {
      throw new ForbiddenException({ message: 'subscription_required', statusCode: 402 });
    }

    // ── Safe defaults for every param ────────────────────────
    const theme = dto.theme || 'explorer';
    const mood = dto.mood || 'energetic';
    const ages: number[] = dto.ages?.length ? dto.ages : [7];
    const durationMinutes = dto.durationMinutes || 60;
    // Use London as a safe fallback so we always have valid coords for Overpass
    const lat = (dto.lat != null && isFinite(dto.lat)) ? dto.lat : 51.5074;
    const lng = (dto.lng != null && isFinite(dto.lng)) ? dto.lng : -0.1278;
    
    // NEW: Budget and transport mode with defaults
    const budget = dto.budget || 50; // Default $50
    const transportMode = dto.transportMode || 'walking';
    const environment = dto.environment || 'mixed';

    const stopCount = this.getStopCount(durationMinutes);
    const ageGroup = this.getAgeGroup(ages);
    const character = this.characters[theme] || { name: 'Bumbee', emoji: '🐝' };

    const tags = this.getThemeTags(theme);
    // NEW: Calculate radius based on transport mode (override manual radius if provided)
    const radius = dto.radius 
      ? Math.min(Math.max(dto.radius, 1000), 7000) 
      : this.getRadiusByTransport(durationMinutes, transportMode);
    
    console.log(`[generate] Budget: $${budget}, Transport: ${transportMode}, Environment: ${environment}, Radius: ${radius}m`);
    
    const overpassUrl = this.configService.get('OVERPASS_API_URL') || 'https://overpass-api.de/api/interpreter';
    // Fallback Overpass instances in case primary fails
    const overpassFallbacks = [
      'https://overpass.kumi.systems/api/interpreter',
      'https://overpass.openstreetmap.ru/api/interpreter',
    ];
    const finaleRadius = radius + 800;

    // ── Build queries ──────────────────────────────────────────
    // Comprehensive query to get diverse POIs (parks, shops, restaurants, attractions, etc.)
    const stopsQuery = [
      `[out:json][timeout:25];`,
      `(`,
      // Leisure & outdoor
      `node(around:${radius},${lat},${lng})[leisure~"playground|park|garden|pitch|sports_centre|miniature_golf|water_park"];`,
      `way(around:${radius},${lat},${lng})[leisure~"playground|park|garden|pitch|miniature_golf"];`,
      // Tourism & culture
      `node(around:${radius},${lat},${lng})[tourism~"attraction|viewpoint|artwork|museum|gallery|zoo|aquarium"];`,
      `way(around:${radius},${lat},${lng})[tourism~"attraction|museum|gallery|zoo|aquarium"];`,
      // Amenities (community, food, entertainment)
      `node(around:${radius},${lat},${lng})[amenity~"fountain|library|community_centre|arts_centre|restaurant|fast_food|ice_cream|cafe|cinema|theatre|bowling_alley"];`,
      `way(around:${radius},${lat},${lng})[amenity~"library|community_centre|arts_centre|restaurant|cinema|theatre|bowling_alley"];`,
      // Shops (diverse retail)
      `node(around:${radius},${lat},${lng})[shop~"ice_cream|bakery|toys|books|craft|chocolate|confectionery|pet|clothes|gift|supermarket|sports|florist|farm"];`,
      // Historic
      `node(around:${radius},${lat},${lng})[historic~"monument|memorial|statue|castle|ruins"];`,
      `);`,
      `out center body 150;`,
    ].join('');

    const finaleQuery = [
      `[out:json][timeout:12];`,
      `(`,
      `node(around:${finaleRadius},${lat},${lng})[amenity~"ice_cream|cafe",i][name];`,
      `node(around:${finaleRadius},${lat},${lng})[shop~"bakery|toys|chocolate|confectionery",i][name];`,
      `);`,
      `out body 20;`,
    ].join('');

    const orsUrl = this.configService.get('OPENROUTE_API_URL') || 'https://api.openrouteservice.org/v2';
    const orsKey = this.configService.get('ORS_API_KEY');
    const meteoUrl = this.configService.get('OPEN_METEO_URL') || 'https://api.open-meteo.com/v1/forecast';

    console.log(`[generate] Firing all external calls in parallel — radius=${radius} lat=${lat} lng=${lng}`);
    const t0 = Date.now();

    // ── Try Google Places first, fallback to Overpass ─────────
    console.log('[generate] Attempting Google Places API...');
    let googlePOIs = await this.fetchPOIsFromGooglePlaces(lat, lng, radius);
    
    let rawPois: any[] = [];
    if (googlePOIs.length > 0) {
      console.log(`[generate] Using ${googlePOIs.length} POIs from Google Places`);
      rawPois = googlePOIs;
    } else {
      console.log('[generate] Google Places unavailable, falling back to Overpass...');
      // Fallback to Overpass
      try {
        const overpassData = await this.fetchFromOverpass(stopsQuery, overpassUrl, overpassFallbacks, 25000);
        rawPois = overpassData.elements || [];
        console.log(`[generate] Got ${rawPois.length} POIs from Overpass`);
      } catch (err) {
        console.error('[generate] Both Google Places and Overpass failed');
        rawPois = [];
      }
    }

    // ── Fire remaining external calls ──────────────────────────
    const [finaleResult, weatherResult] = await Promise.allSettled([
      // 1. Overpass/Google finale
      googlePOIs.length > 0 
        ? this.fetchPOIsFromGooglePlaces(lat, lng, finaleRadius)
        : this.fetchFromOverpass(finaleQuery, overpassUrl, overpassFallbacks, 20000),
      // 2. Open-Meteo weather (fast, ~200ms)
      axios.get(`${meteoUrl}?latitude=${lat}&longitude=${lng}&current_weather=true`, { timeout: 8000 }),
    ]);

    console.log(`[generate] All calls done in ${Date.now() - t0}ms`);

    // ── Process stops ─────────────────────────────────────────
    let pois: any[] = [];
    console.log(`[POI Processing] Raw elements: ${rawPois.length}`);
    
    // Get previous visits for deduplication
    const previousHuntIds = (user.history || []).map((h: any) => h.huntId?.toString());
    const previousStopNames = new Set<string>();
    if (previousHuntIds.length > 0) {
      try {
        const recentHunts = await this.huntModel.find({ _id: { $in: previousHuntIds.slice(-10) } }).select('stops.name').lean();
        recentHunts.forEach((h: any) => (h.stops || []).forEach((s: any) => previousStopNames.add(s.name)));
      } catch { /* non-fatal */ }
    }
    
    // Filter valid POIs and score them
    const validPOIs = rawPois
      .filter(poi => this.isValidPOI(poi))
      .map(poi => ({
        ...poi,
        score: this.scorePOI(poi, lat, lng, previousStopNames),
        estimatedCost: this.estimateStopCost(poi),
        environment: this.categorizeByEnvironment(poi)
      }))
      .sort((a, b) => b.score - a.score);
    
    console.log(`[POI Processing] Valid POIs after filtering: ${validPOIs.length}`);
    
    // NEW: Filter by environment preference
    const envFiltered = this.filterByEnvironment(validPOIs, environment);
    console.log(`[POI Processing] After environment filter (${environment}): ${envFiltered.length}`);
    
    // NEW: Filter by budget
    const budgetFiltered = this.filterPOIsByBudget(envFiltered, budget, stopCount);
    console.log(`[POI Processing] After budget filter ($${budget}): ${budgetFiltered.length}`);
    
    // If insufficient POIs, try expanding radius
    if (budgetFiltered.length < stopCount) {
      console.warn(`[POI Processing] Only ${budgetFiltered.length} POIs found, need ${stopCount}. Consider expanding search.`);
    }
    
    // Order POIs into logical walking route
    pois = this.orderPOIsIntoRoute(budgetFiltered, lat, lng);

    console.log(`[POI Processing] Selected and ordered ${pois.length} POIs`);

    // ── Food stop injection (eatDuring / eatAfter) ────────────
    const eatDuring = dto.preferences?.eatDuring === true;
    // eatDuring=true  → food stop in the MIDDLE of the hunt
    // eatDuring=false → food stop as the LAST stop (eat after hunt)

    if (pois.length >= 3) {
      // Separate food POIs from the valid pool (not yet selected)
      const selectedNames = new Set(pois.map((p: any) => p.tags?.name || ''));
      const remainingFoodPOIs = validPOIs
        .filter(p => this.isFoodPOI(p) && p.tags?.name && !selectedNames.has(p.tags.name));

      // Also check if any already-selected POI is a food place
      const existingFoodIndices = pois
        .map((p: any, i: number) => this.isFoodPOI(p) ? i : -1)
        .filter(i => i >= 0);

      if (eatDuring) {
        // Place food stop at a middle position
        const middleIndex = Math.floor(pois.length / 2);
        const alreadyHasFoodInMiddle = existingFoodIndices.some(
          i => i >= middleIndex - 1 && i <= middleIndex + 1
        );

        if (!alreadyHasFoodInMiddle) {
          if (remainingFoodPOIs.length > 0) {
            // Insert a food POI at the middle position
            const foodPOI = remainingFoodPOIs[0];
            foodPOI.estimatedCost = this.estimateStopCost(foodPOI);
            foodPOI.environment = this.categorizeByEnvironment(foodPOI);
            pois.splice(middleIndex, 0, foodPOI);
            console.log(`[Food Stop] Inserted "${foodPOI.tags?.name}" at middle position ${middleIndex} (eatDuring=true)`);
          } else if (existingFoodIndices.length > 0) {
            // Move an existing food POI to the middle
            const foodIdx = existingFoodIndices[0];
            const [foodPOI] = pois.splice(foodIdx, 1);
            pois.splice(middleIndex, 0, foodPOI);
            console.log(`[Food Stop] Moved existing food POI to middle position ${middleIndex} (eatDuring=true)`);
          } else {
            console.log('[Food Stop] No food POIs available to insert for eatDuring');
          }
        } else {
          console.log('[Food Stop] Food POI already exists near middle — no action needed');
        }
      } else {
        // Place food stop as the LAST stop (eat after hunt)
        const lastIndex = pois.length - 1;
        const lastIsFood = existingFoodIndices.includes(lastIndex);

        if (!lastIsFood) {
          if (remainingFoodPOIs.length > 0) {
            // Append food POI at the end
            const foodPOI = remainingFoodPOIs[0];
            foodPOI.estimatedCost = this.estimateStopCost(foodPOI);
            foodPOI.environment = this.categorizeByEnvironment(foodPOI);
            pois.push(foodPOI);
            console.log(`[Food Stop] Appended "${foodPOI.tags?.name}" as last stop (eatAfter)`);
          } else if (existingFoodIndices.length > 0) {
            // Move an existing food POI to the end
            const foodIdx = existingFoodIndices[existingFoodIndices.length - 1];
            const [foodPOI] = pois.splice(foodIdx, 1);
            pois.push(foodPOI);
            console.log(`[Food Stop] Moved existing food POI to last position (eatAfter)`);
          } else {
            console.log('[Food Stop] No food POIs available to insert for eatAfter');
          }
        } else {
          console.log('[Food Stop] Last stop is already a food POI — no action needed');
        }
      }
    }

    // Trim to stopCount (may have extra from food insertion)
    if (pois.length > stopCount + 1) {
      pois = pois.slice(0, stopCount + 1);
    }

    // ── Process finale ────────────────────────────────────────
    let finaleDestination: { placeName: string; address: string; lat: number; lng: number; googleMapsLink: string; task: string } | null = null;
    if (finaleResult.status === 'fulfilled') {
      // Handle both Google Places array and Overpass object format
      const finaleData = finaleResult.value;
      const finaleOptions = Array.isArray(finaleData) ? finaleData : (finaleData.elements || []);
      
      const validFinaleOptions = finaleOptions
        .filter((p: any) => p.tags?.name && this.isValidPOI(p))
        .sort(() => Math.random() - 0.5);
      
      const stopNames = new Set(pois.map((p: any) => p.tags?.name || ''));
      const treasureType = dto.preferences?.treasureType || 'edible';
      
      // Match finale to treasure preference
      let finalePoi: any = null;
      if (treasureType === 'edible') {
        finalePoi = validFinaleOptions.find((p: any) => p.tags?.shop === 'ice_cream') ||
                    validFinaleOptions.find((p: any) => p.tags?.shop === 'bakery') ||
                    validFinaleOptions.find((p: any) => p.tags?.amenity === 'cafe') ||
                    validFinaleOptions.find((p: any) => p.tags?.shop === 'chocolate');
      } else if (treasureType === 'toy') {
        finalePoi = validFinaleOptions.find((p: any) => p.tags?.shop === 'toys') ||
                    validFinaleOptions.find((p: any) => p.tags?.shop === 'books');
      } else {
        // Mystery or other - pick any good finale
        finalePoi = validFinaleOptions[0];
      }
      
      // Ensure finale is not already in stops
      if (finalePoi && stopNames.has(finalePoi.tags?.name)) {
        finalePoi = validFinaleOptions.find((p: any) => !stopNames.has(p.tags?.name));
      }
      
      if (finalePoi) {
        const finaleType = finalePoi.tags?.amenity || finalePoi.tags?.shop || 'reward';
        const finaleTasks: Record<string, string> = {
          ice_cream: 'Celebrate with a delicious ice cream — you earned it! 🍦',
          cafe: 'Reward yourselves — pick your favourite treat from the menu! ☕🍰',
          bakery: 'Pick the most tempting baked good as your adventure reward! 🥐',
          toys: 'Choose your reward toy — you completed the whole adventure! 🧸',
          books: 'Pick a new book as your treasure — knowledge is power! 📚',
          chocolate: 'Pick your favourite chocolate as your treasure reward! 🍫',
          confectionery: 'Celebrate with something sweet — you finished the hunt! 🍬',
        };
        finaleDestination = {
          placeName: finalePoi.tags.name,
          address: this.buildAddress(finalePoi.tags),
          lat: finalePoi.lat,
          lng: finalePoi.lon,
          googleMapsLink: `https://www.google.com/maps/dir/?api=1&destination=${finalePoi.lat},${finalePoi.lon}`,
          task: finaleTasks[finaleType] || 'Celebrate the end of your adventure! 🎉',
        };
        console.log(`[Finale] Found: ${finalePoi.tags.name} (type: ${finaleType})`);
      } else {
        console.log('[Finale] No reward venue found nearby');
      }
    } else {
      console.warn('[Finale] Query failed:', (finaleResult as any).reason?.message);
    }

    // ── Process weather ───────────────────────────────────────
    let weather = { temp: 0, condition: 'unknown', icon: '' };
    if (weatherResult.status === 'fulfilled') {
      const cw = weatherResult.value.data.current_weather;
      weather = { temp: cw?.temperature || 0, condition: cw?.weathercode?.toString() || '', icon: '' };
    } else {
      console.warn('[Weather] Failed:', (weatherResult as any).reason?.message);
    }

    // ── Build stops array ─────────────────────────────────────
    const stops = pois.map((poi: any, idx: number) => {
      // Generate fallback name if POI doesn't have one
      let stopName = poi.tags?.name;
      if (!stopName) {
        const tags = poi.tags || {};
        if (tags.leisure === 'playground') stopName = 'Local Playground';
        else if (tags.leisure === 'park') stopName = 'Neighborhood Park';
        else if (tags.leisure === 'garden') stopName = 'Community Garden';
        else if (tags.leisure === 'amusement_park') stopName = 'Fun Park';
        else if (tags.leisure === 'water_park') stopName = 'Water Park';
        else if (tags.leisure === 'miniature_golf') stopName = 'Mini Golf';
        else if (tags.amenity === 'fountain') stopName = 'Water Fountain';
        else if (tags.amenity === 'library') stopName = 'Public Library';
        else if (tags.amenity === 'restaurant') stopName = 'Restaurant';
        else if (tags.amenity === 'fast_food') stopName = 'Fast Food Spot';
        else if (tags.amenity === 'cafe') stopName = 'Local Café';
        else if (tags.amenity === 'ice_cream') stopName = 'Ice Cream Parlour';
        else if (tags.amenity === 'cinema') stopName = 'Cinema';
        else if (tags.amenity === 'bowling_alley') stopName = 'Bowling Alley';
        else if (tags.amenity === 'theatre') stopName = 'Theatre';
        else if (tags.amenity === 'community_centre') stopName = 'Community Centre';
        else if (tags.amenity === 'arts_centre') stopName = 'Arts Centre';
        else if (tags.tourism === 'attraction') stopName = 'Local Attraction';
        else if (tags.tourism === 'viewpoint') stopName = 'Scenic Viewpoint';
        else if (tags.tourism === 'museum') stopName = 'Museum';
        else if (tags.tourism === 'gallery') stopName = 'Art Gallery';
        else if (tags.tourism === 'zoo') stopName = 'Zoo';
        else if (tags.tourism === 'aquarium') stopName = 'Aquarium';
        else if (tags.historic) stopName = 'Historic Site';
        else if (tags.shop === 'ice_cream') stopName = 'Ice Cream Shop';
        else if (tags.shop === 'bakery') stopName = 'Local Bakery';
        else if (tags.shop === 'toys') stopName = 'Toy Store';
        else if (tags.shop === 'books') stopName = 'Bookshop';
        else if (tags.shop === 'pet') stopName = 'Pet Shop';
        else if (tags.shop === 'chocolate') stopName = 'Chocolate Shop';
        else if (tags.shop === 'confectionery') stopName = 'Sweet Shop';
        else if (tags.shop === 'gift') stopName = 'Gift Shop';
        else if (tags.shop === 'florist') stopName = 'Flower Shop';
        else if (tags.shop === 'mall') stopName = 'Shopping Mall';
        else if (tags.shop) stopName = 'Local Shop';
        else stopName = `Stop ${idx + 1}`;
      }
      
      const locationType = this.getLocationType(poi);
      const task = this.assignTask(theme, locationType, idx, ageGroup);
      const poisLat = poi.lat ?? lat;
      const poisLng = poi.lon ?? lng;
      return {
        name: stopName,
        lat: poisLat,
        lng: poisLng,
        address: this.buildAddress(poi.tags || {}),
        googleMapsLink: `https://www.google.com/maps/dir/?api=1&destination=${poisLat},${poisLng}`,
        type: poi.tags?.leisure || poi.tags?.amenity || poi.tags?.shop || 'point',
        isFinale: false,
        clue: this.generateClue(theme, stopName, ageGroup),
        challenge: task.taskPrompt,
        taskType: task.taskType,
        taskPrompt: task.taskPrompt,
        taskAnswer: task.taskAnswer || '',
        missionTitle: task.missionTitle,
        completed: false,
        unlocked: idx === 0,
        
        // NEW: Cost and environment info
        estimatedCost: poi.estimatedCost || 0,
        priceLevel: poi.priceLevel || 0,
        environment: poi.environment || 'outdoor'
      };
    });
    
    // NEW: Calculate total cost
    const totalEstimatedCost = stops.reduce((sum, s) => sum + (s.estimatedCost || 0), 0);
    
    console.log(`[generate] Total estimated cost: $${totalEstimatedCost} (budget: $${budget})`);

    // ── Check if we have enough POIs ─────────────────────────
    if (stops.length < 3) {
      throw new BadRequestException(
        `Unable to generate hunt: only ${stops.length} suitable locations found in your area. ` +
        `Try a different location or increase the search radius.`
      );
    }
    
    // If we have fewer stops than requested, that's okay - just log it
    if (stops.length < stopCount) {
      console.log(`[generate] Generated ${stops.length} stops (requested ${stopCount})`);
    } else {
      console.log(`[generate] Generated ${stops.length} real POI stops`);
    }

    // ── Walking route (after stops are built, non-blocking if slow) ──
    let route = { distance: 0, duration: 0, polyline: '' };
    if (orsKey) {
      try {
        const coords = stops.map((s: any) => [s.lng, s.lat]);
        const { data: routeData } = await axios.post(
          `${orsUrl}/directions/foot-walking`,
          { coordinates: coords },
          { headers: { Authorization: `Bearer ${orsKey}`, 'Content-Type': 'application/json' }, timeout: 10000 },
        );
        const rObj = routeData.routes?.[0];
        if (rObj) {
          route = {
            distance: Math.round(rObj.summary?.distance || 0),
            duration: Math.round(rObj.summary?.duration || 0),
            polyline: rObj.geometry || '',
          };
          console.log(`[ORS] Route: ${route.distance}m`);
        }
      } catch (orsErr: any) {
        console.warn('[ORS] Route skipped:', orsErr?.response?.status, orsErr?.message);
      }
    } else {
      console.warn('[ORS] No API key — skipping route');
    }

    const storyIntro = this.generateStoryIntro(theme, character.name);

    console.log(`[generate] Creating hunt: theme=${theme} stops=${stops.length} userId=${userId}`);

    let hunt: any;
    try {
      hunt = await this.huntModel.create({
        userId,
        theme,
        mood,
        ages,
        durationMinutes,
        storyIntro,
        storyCharacter: character.name,
        storyCharacterEmoji: character.emoji,
        stops,
        route,
        weather,
        finale: finaleDestination,
        preferences: dto.preferences || {},
        
        // NEW FIELDS
        budget,
        transportMode,
        environment,
        totalEstimatedCost
      });
    } catch (dbErr: any) {
      console.error('[generate] DB create failed:', dbErr?.message);
      throw new Error('Failed to save hunt to database: ' + dbErr?.message);
    }

    console.log(`[generate] Hunt created: ${hunt._id}`);
    return hunt.toObject();
  }

  // ── Existing methods ──────────────────────────────────────

  async getHistory(userId: string) {
    const user = await this.userModel.findById(userId).select('history').lean();
    const history = user?.history || [];
    if (history.length === 0) return [];

    const huntIds = history
      .slice(-20)                             // last 20 entries
      .map((h: any) => h.huntId)
      .filter(Boolean);

    const hunts = await this.huntModel
      .find({ _id: { $in: huntIds } })
      .select('theme storyCharacterEmoji stops route rating completedAt createdAt')
      .lean();

    // Sort newest-first
    const idOrder = new Map(history.map((h: any, i: number) => [h.huntId?.toString(), i]));
    return hunts
      .sort((a: any, b: any) => {
        const ai = idOrder.get(a._id.toString()) ?? 999;
        const bi = idOrder.get(b._id.toString()) ?? 999;
        return bi - ai;
      })
      .map((h: any) => ({
        _id: h._id,
        theme: h.theme,
        charEmoji: h.storyCharacterEmoji || '🐝',
        stopsCompleted: (h.stops || []).filter((s: any) => s.completed).length,
        totalStops: (h.stops || []).length,
        distanceKm: +((h.route?.distance || 0) / 1000).toFixed(1),
        rating: h.rating || null,
        completedAt: h.completedAt || h.createdAt,
      }));
  }

  async getHunt(id: string) {
    return this.huntModel.findById(id).lean();
  }

  async saveTrack(huntId: string, walkedPath: { lat: number; lng: number }[]) {
    return this.huntModel.findByIdAndUpdate(huntId, { $set: { walkedPath } }, { new: true }).lean();
  }

  async completeStop(huntId: string, stopIndex: number) {
    const update: any = {};
    update[`stops.${stopIndex}.completed`] = true;
    update[`stops.${stopIndex}.completedAt`] = new Date();
    // Unlock next stop
    update[`stops.${stopIndex + 1}.unlocked`] = true;
    return this.huntModel.findByIdAndUpdate(huntId, { $set: update }, { new: true }).lean();
  }

  async uploadStopPhoto(huntId: string, stopIndex: number, file: Express.Multer.File) {
    if (!file) throw new NotFoundException('No file provided');
    try {
      const result = await new Promise<any>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'bumbee-photos', resource_type: 'image' },
          (error, result) => { if (error) reject(error); else resolve(result); },
        );
        stream.end(file.buffer);
      });
      const update: any = {};
      update[`stops.${stopIndex}.photoUrl`] = result.secure_url;
      return this.huntModel.findByIdAndUpdate(huntId, { $set: update }, { new: true }).lean();
    } catch {
      return this.huntModel.findById(huntId).lean();
    }
  }

  async completeHunt(userId: string, huntId: string) {
    const hunt = await this.huntModel.findByIdAndUpdate(huntId, { $set: { status: 'completed' } }, { new: true }).lean();
    await this.userModel.findByIdAndUpdate(userId, {
      $push: {
        history: { huntId, theme: hunt?.theme, mood: hunt?.mood, completedAt: new Date(), rating: hunt?.rating },
      },
    });
    const streakResult = await this.updateStreak(userId);
    return { hunt, ...streakResult };
  }

  async updateStreak(userId: string): Promise<{ newBadge: string | null }> {
    const user = await this.userModel.findById(userId);
    if (!user) return { newBadge: null };
    const now = new Date();
    const day = now.getDay();
    const isWeekend = day === 0 || day === 6;
    if (!isWeekend) return { newBadge: null };

    const lastDate = user.streaks?.lastWeekendDate;
    let streak = user.streaks?.currentStreak || 0;
    if (lastDate) {
      const diffDays = Math.floor((now.getTime() - new Date(lastDate).getTime()) / 86400000);
      if (diffDays <= 2) return { newBadge: null };
      streak = diffDays <= 9 ? streak + 1 : 1;
    } else {
      streak = 1;
    }

    const weekendsPlanned = (user.streaks?.weekendsPlanned || 0) + 1;
    const badges = [...(user.streaks?.badges || [])];
    let newBadge: string | null = null;
    const milestones: Record<number, string> = { 3: '🌟 Getting Started', 7: '🔥 On Fire Family', 15: '🏆 Adventure Pro', 30: '👑 Bumbee Legends' };
    if (milestones[weekendsPlanned] && !badges.includes(milestones[weekendsPlanned])) {
      newBadge = milestones[weekendsPlanned];
      badges.push(newBadge);
    }

    await this.userModel.findByIdAndUpdate(userId, {
      $set: { 'streaks.currentStreak': streak, 'streaks.weekendsPlanned': weekendsPlanned, 'streaks.lastWeekendDate': now, 'streaks.badges': badges },
    });
    return { newBadge };
  }

  async rateHunt(huntId: string, body: { rating: number; feedbackText?: string; wouldRecommend?: boolean }) {
    return this.huntModel.findByIdAndUpdate(huntId, { $set: body }, { new: true }).lean();
  }

  async saveThemeToFavorites(userId: string, huntId: string) {
    const hunt = await this.huntModel.findById(huntId).lean();
    if (!hunt) return;
    await this.userModel.findByIdAndUpdate(userId, { $addToSet: { 'familyProfile.favorites': hunt.theme } });
  }

  async generateRecap(huntId: string) {
    const hunt = await this.huntModel.findById(huntId).lean();
    if (!hunt) throw new NotFoundException('Hunt not found');

    const photos = (hunt.stops || [])
      .filter((s: any) => s.photoUrl)
      .slice(0, 4)
      .map((s: any) => `<img src="${s.photoUrl}" />`)
      .join('');

    const html = `<!DOCTYPE html><html><head>
      <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@600&family=Nunito:wght@400;600&display=swap" rel="stylesheet">
      <style>
        body{margin:0;padding:0}
        .card{width:600px;background:#E8F4FD;border:3px solid #1A8FE3;border-radius:16px;padding:24px;font-family:'Nunito',sans-serif;box-sizing:border-box}
        h1{color:#1A2332;font-family:'Fredoka',sans-serif;text-align:center;margin:0 0 8px}
        .theme{text-align:center;font-size:48px;margin-bottom:8px}
        .story{text-align:center;font-style:italic;color:#6B7A8D;font-size:14px;margin:8px 24px}
        .stats{text-align:center;color:#6B7A8D;margin:4px 0}
        .giggles{text-align:center;color:#F5C518;font-size:18px;font-weight:600;margin:12px 0}
        .photos{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:16px 0}
        .photos img{width:100%;border-radius:8px;aspect-ratio:1;object-fit:cover}
        .footer{display:flex;justify-content:space-between;align-items:center;margin-top:16px}
        .logo{color:#1A8FE3;font-family:'Fredoka',sans-serif;font-size:14px}
        .copyright{color:#6B7A8D;font-size:10px}
      </style></head><body><div class="card">
        <div class="theme">${hunt.storyCharacterEmoji || '🐝'}</div>
        <h1>${hunt.storyCharacter || 'Bumbee'} Adventure Recap</h1>
        <p class="story">"${hunt.storyIntro || ''}"</p>
        <p class="stats">Theme: ${hunt.theme} | Stops: ${hunt.stops?.length || 0}</p>
        <p class="stats">Distance: ${((hunt.route?.distance || 0) / 1000).toFixed(1)} km</p>
        <p class="giggles">${Math.floor(Math.random() * 15) + 10} giggles estimated 😄</p>
        <div class="photos">${photos}</div>
        <div class="footer"><span class="copyright">© 2025 Bumbee Ltd</span><span class="logo">🐝 Bumbee</span></div>
      </div></body></html>`;

    try {
      const result = await cloudinary.uploader.upload(
        `data:text/html;base64,${Buffer.from(html).toString('base64')}`,
        { folder: 'bumbee-recaps', resource_type: 'raw' },
      );
      await this.huntModel.findByIdAndUpdate(huntId, { recapCardUrl: result.secure_url });
      return { recapCardUrl: result.secure_url, html };
    } catch {
      return { recapCardUrl: null, html };
    }
  }

  // ── Walking Route (user → stop) ────────────────────────────

  async getWalkingRoute(fromLat: number, fromLng: number, toLat: number, toLng: number) {
    const orsKey = this.configService.get('ORS_API_KEY');
    try {
      const { data } = await axios.get(
        `https://api.openrouteservice.org/v2/directions/foot-walking`,
        {
          params: {
            api_key: orsKey,
            start: `${fromLng},${fromLat}`,
            end: `${toLng},${toLat}`,
          },
        },
      );
      const coords = data.features?.[0]?.geometry?.coordinates || [];
      const polyline = coords.map((c: number[]) => ({ latitude: c[1], longitude: c[0] }));
      const summary = data.features?.[0]?.properties?.summary || {};
      const segments = data.features?.[0]?.properties?.segments || [];

      // Extract turn-by-turn instructions
      const instructions: Array<{
        instruction: string;
        distance: number;
        duration: number;
        type: number;
      }> = [];
      for (const segment of segments) {
        const steps = segment.steps || [];
        for (const step of steps) {
          if (step.instruction) {
            instructions.push({
              instruction: step.instruction,
              distance: step.distance || 0,
              duration: step.duration || 0,
              type: step.type || 0,
            });
          }
        }
      }

      return {
        polyline,
        distance: summary.distance || 0,
        duration: summary.duration || 0,
        instructions,
      };
    } catch (err) {
      // Fallback: straight line
      return {
        polyline: [
          { latitude: fromLat, longitude: fromLng },
          { latitude: toLat, longitude: toLng },
        ],
        distance: 0,
        duration: 0,
        instructions: [],
      };
    }
  }
}
