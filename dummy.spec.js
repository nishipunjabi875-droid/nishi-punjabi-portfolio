const { Builder, By, Key, until, error } = require("selenium-webdriver");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;

describe("Leadform testing ", function () {
  let csvWriter;

  before(async function () {
    // Initialize CSV writer before tests run
    csvWriter = createCsvWriter({
      path: "hAll.csv",
      header: [
        { id: "testCase", title: "Test Case" },
        // { id: 'inputName', title: 'Input Field Name' },
        { id: "inputValue", title: "Input Value" },
        { id: "status", title: "Status" },
        { id: "result", title: "Result" },
        { id: "timestamp", title: "Timestamp" },
      ],
    });
  });


  //   Username - koxox71966@downlor.com

  // Password - 679756bda56d0

  let arr = ["Tester", 9314445399, "wokasa7633@noroasis.com", 313001, '67f4a72aebf1b'];

  const guestArray = [9314441244, "tester1244@yopmail.com"];



  it(" 01 registraton form  ", async function () {

    let driver = await new Builder().forBrowser("chrome").build();
    await driver.manage().window().maximize();

    let testResult = {
      testCase: '01 Register form ',
      inputValue: ` " Name:${arr[0]}, Mobile no : ${arr[1]}, Pincode:${arr[3]}  Email id: ${arr[2]} , password:${arr[4]}   " `,
      status: "Fail",
      result: ' mobile number already registered  ',
      timestamp: new Date().toISOString()
    };

    try {


      await driver.get("http://10.4.1.9/phpmyadmin/index.php?db=woodenstreetnew&table=oc_product&target=tbl_select.php&token=111348dceedc71d8e4e4e0330455c083#PMAURL-0:index.php?db=woodenstreetnew&table=oc_product&server=1&target=tbl_select.php&token=111348dceedc71d8e4e4e0330455c083");
      await driver.sleep(3000);

      // // Click on the login button to open the login form
      // await driver.findElement(By.className("login without-login")).click();

      // // Wait for the login popup to appear and then click the login button
      // await driver.findElement(By.id("login_popup_btn")).click();

      // Wait for the email input field to be visible and then enter the email
      await driver.wait(until.elementLocated(By.id("input_username")), 5000);
      await driver.findElement(By.id("input_username")).sendKeys('root', Key.RETURN);
      await driver.findElement(By.id("input_password")).sendKeys("wood@123", Key.RETURN)

      await driver.sleep(3000);



      const arr = [   "cultured-marble-hand-painted-temple",
        "casper-3-seater-sofa-dusky-leaf",
        "winster-l-shape-multifunctional-corner-sofa-honey-finish",
        "e-footio-pro-foot-massager",
        "rectangle-black-long-framed-mirror",
        "iris-blue",
        "estelle-chaise-lounge-indigo-blue",
        "warner-3-door-multi-utility-wardrobe-honey-finish",
        "converis-tv-unit-with-cane-detailing-and-brass-accents-ash-wood-honey-finish",
        "duroflex-up-right-duropedic-bonded-foam-mattress-5-inch-queen-size-78-x-60",
        "penguin-dreamlux-future-a-mattress-demo18-14-6-inch",
        "marble-finish-teak-wood-home-temple-with-storange",
        "blue-fitted-waterproof-mattress%20protector-single-size-78-36-inch",
        "indian-aesthetic-pure-cotton-queen-size-hand-block-print-dohar",
        "lunamist-ultra-comfort-latex-pillow-ventilated-cool-gel-infused-for-neck-and-shoulder-pain-with-removable-cover-medium-white-set-of-4",
        "grey-lounge-chair-with-golden-legs",
        "evelyn-3-seater-wooden-sofa-walnut-finish-chestnut-brown",
        "lord-krishna-idol-in-darbar-figurines",
        "berlin-l-shape-right-arm-corner-sofa-chestnut-brown",
        "stairway-3-seater-fabric-sofa-cotton-silica-smoke",
        "pure-mul-cotton-queen-size-hand-block-printed-dohar",
        "duroflex-up-right-duropedic-bonded-foam-mattress-5-inch-queen-size-75-x-66",
        "maroon-fitted-waterproof-mattress%20protector-single-size-78-36-inch",
        "aile-lounge-chair-in-pitch-grey-velvet-with-golden-leaf-base",
        "casper-1-seater-fabric-sofa-indigo-blue",
        "magnus-hanging-light-white",
        "exquisite-pure-cotton-queen-size-hand-block-printed-dohar",
        "reversible-comforter-coffee-brown-and-ash-grey-double-size",
        "orlando-fabric-sofa-set-chestnut-brown",
        "joan-lounge-chair-rosy-leaf-walnut",
        "dore-wall-light",
        "penguin-ortho-memory-foam-mattress-4-inch-75-6-36-inch",
        "gracia-artificial-succulent-plant-in-a-ceramic-pot",
        "orchid-arm-chair-cotton-rose-vineyard",
        "amalfiee-handmade-12-pcs-navhara-luxury-dinner",
        "jacquard-corded-polyester-blackout-roller-blind-for-window-beige-84-38-inch",
        "berlin-fabric-sofa-set-velvet-dark-olive-green",
        "berlin-fabric-sofa-set-velvet-dark-olive-green",
        "gold-finish-marbled-study-lamp",
        "orlando-fabric-sofa-set-indigo-blue",
        "spring-tribals",
        "foley-2-seater-with-2-cushions-orange-rug",
        "valencia-leatherette-motorized-recliner-sofa-napa-yellow",
        "matrix-study-chair",
        "carmen-divan-exotic-teak-finish",
        "multicolour-arc-shaped-wall-mounted-lamp-light-with-brass-holder-and-bulb",
        "frodo-study-table-honey-finish",
        "carmen-backrest-storage-divan-flowery-wenge-finish",
        "adolph-bench-rosy-leaf",
        "organic-bamboo-bedsheet-queen-size-300-tc-flat-bedsheet-(white)",
        "organic-bamboo-bedsheet-queen-size-300-tc-fitted-bedsheet-(white)",
        "berlin-fabric-sofa-set-velvet-mulberry-pink",
        "royal-wood-brown-cock-wall-lights",
        "square-ottoman-blue-rug",
        "berlin-fabric-sofa-set-indigo-blue",
        "tortoise-big-antique-gold-plated-in-metal-handicrafts-paradise",
        "wooden-rope-jute-bench",
        "kids-partition-small-plate-double-coated-set-of-2-red",
        "wooden-l-shape-executive-computer-desk",
        "canary-bunk-bed-marigold-yellow",
        "multicolor-leaf-printed-table-runner-14-72-inch",
        "rodrick-3-seater-sofa",
        "lustrous-glass-pendant-light-grey",
        "floral-green-pure-cotton-queen-size-hand-block-printed-dohar",
        "modular-wardrobe",
        "windsor-premium-ash-wood-tv-unit-with-drawer-fluted-glass-cane-and-brass-accents-fits-up-to-75-tv-mid-century-entertainment-cabinet-ash-wood-honey-finish",
        "wooden-street-penguin-dream-lux-mattress-10-year-warranty-roll-packed-queen-size-78x60x8-inches-blue",
        "mountmist-wedge-knitted-memory-foam-pillow-ventilated-cool-gel-infused-for-neck-and-shoulder-pain-with-removable-cover-white",
        "moonmist-premium-memory-foam-pillow-with-blue-piping-line-medium-white",
        "wooden-street-penguin-dream-lux-mattress-10-year-warranty-cool-gel-memory-foam-with-340-gsm-premium-knitted-fabric-anti-skid-base-for-enhanced-stability-charcoal-infused-advanced-contour-support-acst-roll-packed-king-size-78x72x6-inches-blue",
        "moonmist-memory-foam-pillow-ventilated-cool-gel-infused-for-neck-and-shoulder-pain-with-removable-cover-medium-white-set-of-2",
        "moonmist-memory-foam-pillow-ventilated-cool-gel-infused-for-neck-and-shoulder-pain-with-removable-cover-large-white-set-of-4",
        "lunamist-ultra-comfort-latex-pillow-ventilated-cool-gel-infused-for-neck-and-shoulder-pain-with-removable-cover-large-white",
        "lunamist-ultra-comfort-latex-pillow-ventilated-cool-gel-infused-for-neck-and-shoulder-pain-with-removable-cover-large-white-set-of-4",
        "lunamist-ultra-comfort-latex-pillow-ventilated-cool-gel-infused-for-neck-and-shoulder-pain-with-removable-cover-medium-white",
        "citadel-poster-bed-with-storage-king-size-honey-finish",
        "flo-led-wall-light-s",
        "for-unique-blue-colored-timeless-print-bedroom-window-curtains-designs-set-of-2-blue-5-feet",
        "plastic-rattan-oval-basket-set-of-2-brown",
        "grey-lounge-chair-with-golden-legs",
        "classic-design-pure-cotton-queen-size-hand-block-printed-dohar",
        "canary-bunk-bed-cardinal-red",
        "grace-bunk-bed-marigold-yellow",
        "duroflex-up-right-duropedic-bonded-foam-mattress-5-inch-queen-size-78-x-66",
        "green-forest-mdf-art-panels-set-of-5-frames",
        "eeva-plain-foldable-anti-skid-yoga-mat-green-6-x-2-feet",
        "dark-chocolate-unique-design-wall-mounted-pooja-shelf",
        "solace-right-l-shape-wooden-sofa-walnut-finish",
        "ceradeco-set-of-6-transparent-320-ml-drinking-glasses",
        "brown-fiber-glass-lotus-ganesha-water-fountain",
        "macrame-cotton-two-tier-plant-hanger",
        "sprint-book-shelf-exotic-teak-finish",
        "brice-round-integrated-led-metal-chandelier",
        "white-fitted-waterproof-mattress%20protector-single-size-78-36-inch",
        "duroflex-up-right-duropedic-bonded-foam-mattress-5-inch-double-size-72-x-42",
        "shell-arm-chair-cream-robins",
        "handmade-distress-wooden-table-lamp-in-vase-design-with-beige-fabric-shade-black",
        "rosenfort-5-gold-grey-and-amber-hanging-cluster-chandelier",
        "apolo-3-seater-living-room-sofa-with-2-lounge-chairs-and-4-cushions-gardenia-collection",
        "diamond-shape-green-planter-with-golden-shelf",
        "duroflex-balance-5-zoned-body-support-orthopaedic-mattress-6-inch-single-size-72-x-35",
        "barfi-leatherette-heavy-duty-metal-frame-study/office-chair-with-armrests-black-set-of-2",
        "terry-fitted-maroon-waterproof-mattress%20protector-king-size-78-72-inch",
        "rodrick-3-seater-sofa",
        "yellow-velvet-lounge-chair",
        "teak-wood-handicraft-home-temple-with-storage",
        "shell-without-arm-dining-chair-salmon-pink",
        "moonmist-premium-memory-foam-pillow-with-blue-piping-line-large-white",
        "getrest-luxeadapt-10-ergomax-hyper-memory-7-layer-mattres-biocrystal-stress-relief-10-single-75-48",
        "white-cotton-floral-print-queen-bed-sheet-with-2-pillow-cover"
       

      ];

      for (let index = 0; index < arr.length; index++) {
        const element = arr[index];
        console.log(element, index)

        try {


          await driver.sleep(1000);

          await driver.get("http://10.4.1.9/phpmyadmin/index.php?db=woodenstreetnew&table=oc_product&target=tbl_select.php&token=111348dceedc71d8e4e4e0330455c083#PMAURL-0:index.php?db=woodenstreetnew&table=oc_product&server=1&target=tbl_select.php&token=111348dceedc71d8e4e4e0330455c083");

          await driver.sleep(1000);


          await driver.executeScript("window.scrollBy(0, 1100);");

          await driver.wait(until.elementLocated(By.id("fieldID_61")), 10000);

          await driver.findElement(By.id("fieldID_61")).sendKeys(element, Key.RETURN);

          await driver.sleep(1000);



          await driver.wait(until.elementLocated(By.xpath('//*[@id="table_results"]/tbody/tr[1]/td[7]')), 5000);

          const productElements = await driver.findElements(By.xpath('//*[@id="table_results"]/tbody/tr[1]/td[7]'));


          const ticketElements = await driver.findElements(By.xpath('//*[@id="table_results"]/tbody/tr/td[5]'));


          await driver.sleep(1000);

          // Extract text from each product element
          let productNames = [];
          for (let product of productElements) {
            let productName = await product.getText();
            productNames.push(productName);
  
            console.log(productNames);
          }
          await driver.sleep(100);

          let  prId =[];
  
          for (let ticket of ticketElements) {
            let ticketName = await ticket.getText();
            
            prId.push(ticketName);
    
            console.log(prId);
          }
    


          let details = [];
          details.push({
            testCase: ` ' ${element} '`,
            inputValue: ` '${prId}   `,
            status: "Pass",
            result: ` '   ${productNames} ' `,
            timestamp: new Date().toISOString(),  
          });
  
          testResult.result = "Passed";
          await csvWriter.writeRecords(details);
          console.log("test result saved to csv file ");





            await driver.sleep(1000);


          


        } catch (error) {

          console.log(error)

        }
      }
    } finally {
      // await driver.quit();
    }





  })







  after(async function () {
    // Optionally, perform any cleanup here
  });
});