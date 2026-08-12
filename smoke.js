const { Builder, By, Key, until } = require("selenium-webdriver");
const createCsvWriter = require('csv-writer').createObjectCsvWriter;



describe("Leadform testing ", function () {
    let csvWriter;

    before(async function () {
        // Initialize CSV writer before tests run
        csvWriter = createCsvWriter({
            path: 'smoke.csv',
            header: [
                { id: 'testCase', title: 'Test Case' },
                // { id: 'inputName', title: 'Input Field Name' },
                { id: 'inputValue', title: 'Input Value' },
                { id: 'result', title: 'Result' },
                { id: 'timestamp', title: 'Timestamp' }
            ]
        });
    });


    let arr = [9314444218, "tester218@gmail.com"]




        //first  test case of register 
        it(" registraton form  ", async function () {

            let driver = await new Builder().forBrowser("chrome").build();
            await driver.manage().window().maximize();

            let testResult = {
                testCase: '01 Register form ',
                inputValue: " usernaem:' teter', mobile no : '9314444151,  Email id: 'tester151@gmail.com' , password: 123456   ",
                result: 'Failed ',
                timestamp: new Date().toISOString()
            };

            try {
                await driver.get("https://www.woodenstreet.com/");

                // // Click on the login button to open the login form
                // await driver.findElement(By.className("login without-login")).click();

                // // Wait for the login popup to appear and then click the login button
                // await driver.findElement(By.id("sign_up_popup_btn")).click();

                // Wait for the name  input field to be visible and then enter the name 
                // let arr=[9314444162, "tester162@gmail.com"]



                await driver.wait(until.elementLocated(By.id("register_firstname")), 13000);
                await driver.findElement(By.id("register_firstname")).sendKeys('tester', Key.RETURN);
                await driver.findElement(By.id("telephone")).sendKeys(arr[0], Key.RETURN);

                await driver.findElement(By.name("pincode")).sendKeys(312604, Key.RETURN);
                await driver.findElement(By.id("register_email")).sendKeys(arr[1], Key.RETURN);

                await driver.findElement(By.id("register_password")).sendKeys(123456, Key.RETURN);

                await driver.sleep(5000);

                await driver.findElement(By.id("loginclose1")).click();

                await driver.sleep(4000);





                // Click on the login button to open the login form
                await driver.findElement(By.className("login without-login")).click();
                await driver.sleep(1000);

                // Wait for the login popup to appear and then click the login button
                await driver.findElement(By.id("login_popup_btn")).click();
                await driver.sleep(1000);

                // Wait for the email input field to be visible and then enter the email
                await driver.wait(until.elementLocated(By.id("login_email")), 5000);
                await driver.findElement(By.id("login_email")).sendKeys(arr[1], Key.RETURN);
                await driver.findElement(By.id("password")).sendKeys(123456, Key.RETURN)

                await driver.sleep(3000);
                // Find all product elements    #article_76095 > div.proud-box > div.price > strong
                const productElements = await driver.findElements(By.className("orange"));

                // Extract text from each product element
                let productNames = [];
                for (let product of productElements) {
                    let productName = await product.getText();

                    productNames.push({
                        testCase: '01 Register form ',
                        inputValue: ` " usernaem:' teter', mobile no : ${arr[0]},  Email id: ${arr[1]} , password: 123456   " `,

                        result: ` "New Register  user name" ,  ${productName} `,
                        timestamp: new Date().toISOString()
                    });
                }

                console.log('User Name:', productNames);

                testResult.result = 'Passed';
                await csvWriter.writeRecords(productNames);
                console.log('test result saved to csv file ');

            } catch (error) {

                console.log('error during test execution ', error);
                testResult.result = 'Failed ';
                await csvWriter.writeRecords([testResult]);


            }

            finally {
                await driver.quit();
            }



        })

     //second test case login 
     it(' 02 Register account profile details ', async function () {

        let driver = await new Builder().forBrowser("chrome").build();
        await driver.manage().window().maximize();

        let testResult = {
            testCase: ' 02 Register account profile details ',
            inputValue: " Email id: 'tester1@gmail.com' , password: 123456   ",
            result: 'Failed ',
            timestamp: new Date().toISOString()
        };

        try {
            await driver.get("https://www.woodenstreet.com/");

            // Click on the login button to open the login form
            await driver.findElement(By.className("login without-login")).click();

            // Wait for the login popup to appear and then click the login button
            await driver.findElement(By.id("login_popup_btn")).click();

            // Wait for the email input field to be visible and then enter the email
            await driver.wait(until.elementLocated(By.id("login_email")), 5000);
            await driver.findElement(By.id("login_email")).sendKeys(arr[1], Key.RETURN);
            await driver.findElement(By.id("password")).sendKeys(123456, Key.RETURN)

            await driver.sleep(3000);
            // Find all product elements    #article_76095 > div.proud-box > div.price > strong
            const productElements = await driver.findElements(By.className("orange"));

            await driver.sleep(1000);

                 await driver.findElement(By.className('orange')).click();

                await driver.sleep(1000);  

                await driver.findElement(By.className('edit-pro')).click();

                // const userElements = await driver.findElements(By.className("box"));
                await driver.sleep(1000);  


                const edit=["firstname", "lastname", "email", "telephone" ]

                let data = [];

                for (let index = 0; index < edit.length; index++) {
                    const element = edit[index];

                    let inputField = await driver.findElement(By.name(element));
                    await driver.sleep(100);  
                    let userElements =await inputField.getAttribute("value");
                    await driver.sleep(100);  
                    console.log( element, ':', userElements);
                    data.push(  `${element} :${userElements}  `);
                    await driver.sleep(1000); 

                }

                let details= [];

                console.log(data);

                details.push({
                    testCase: ' 02 Register account profile details ',
                    inputValue: ` " usernaem:' teter', mobile no : ${arr[0]},  Email id: ${arr[1]} , password: 123456   " `,
                    result: data,
                    timestamp: new Date().toISOString()


                })



            testResult.result = 'Passed';
            await csvWriter.writeRecords(details);
            console.log('test result saved to csv file ');

        } catch (error) {

            console.log('error during test execution ', error);
            testResult.result = 'Failed ';
            await csvWriter.writeRecords([testResult]);


        }

        finally {
            await driver.quit();
        }



    })



    //Third test case of pincode lead 
    it(" 03 Pincode validation  ", async function () {

        let driver = await new Builder().forBrowser("chrome").build();
        await driver.manage().window().maximize();

        let testResult = {
            testCase:  ' 03  Pincode validation ',
            inputValue: " 313001, 312604  ",
            result: 'Failed ',
            timestamp: new Date().toISOString()
        };

        try {

            await driver.get("https://www.woodenstreet.com/");

            await driver.sleep(2000);

            await driver.findElement(By.className("edit-storebtn")).click();

            await driver.sleep(300);

            let pincode = [313001, 312604]


            let data = [];

            for (let index = 0; index < pincode.length; index++) {
                const element = pincode[index];

                await driver.sleep(300);
                await driver.wait(until.elementLocated(By.id("headerpin")), 4000);
                await driver.findElement(By.id("headerpin")).sendKeys(element, Key.RETURN);
                await driver.sleep(300);

                let output = await driver.findElement(By.className("hedertext")).getText();
                await driver.sleep(300);

                data.push(` ${element} : ${output}`);
                await driver.sleep(300);

                await driver.findElement(By.id("changeheader")).click();
                await driver.sleep(300);



            };

            let details = [];
            details.push({
                testCase: " 03  Pincode validation ",
                inputValue: pincode,
                result: data,
                timestamp: new Date().toISOString()
            })

            testResult.result = 'Passed';
            await csvWriter.writeRecords(details);
            console.log('test result saved to csv file ')




        } catch (error) {

            console.log('error during test execution ', error);
            testResult.result = 'Failed ';
            await csvWriter.writeRecords([testResult]);


        }

        finally {
            await driver.quit();
        }



    })

    // 4 test case of pincode lead 
    it(" 04 Tract order of a user  ", async function () {

        let driver = await new Builder().forBrowser("chrome").build();
        await driver.manage().window().maximize();

        let testResult = {
            testCase: '04 Tract order of a user ',
            inputValue: " pincode  ",
            result: 'Failed ',
            timestamp: new Date().toISOString()
        };

        try {

            await driver.get("https://www.woodenstreet.com/track-order-by-email");
            await driver.sleep(800);

            let track = [675379, "sonu@woodenstreet.com"]

            await driver.wait(until.elementLocated(By.id('order_id')), 1000);
            await driver.findElement(By.id("order_id")).sendKeys(track[0], Key.RETURN);

            await driver.findElement(By.id("email")).sendKeys(track[1], Key.RETURN);

            await driver.findElement(By.className("form-group bottom clearfix")).click();

            await driver.sleep(2000);

            let css = ['body > section.myOrders > div > div > div > div:nth-child(1) > label > span:nth-child(1) > a',
                "body > section.myOrders > div > div > div > div:nth-child(1) > label > span.date",
                "body > section.myOrders > div > div > div > ul > li > div > p > a",
                "body > section.myOrders > div > div > div > ul > li > div > small",
                "body > section.myOrders > div > div > div > ul > li > div > span",
                "body > section.myOrders > div > div > div > ul > li > div > label"


            ];

            let data = [];

            for (let index = 0; index < css.length; index++) {
                const element = css[index];
                await driver.sleep(500);
                let value = await driver.findElement(By.css(element)).getText();

                await driver.sleep(500);

                data.push(value);

            }

            let details = [];
            details.push({
                testCase: " 04 Track order details  ",
                inputValue: `order id: ${track[0]  },  Email id: ${track[1]}`,
                result: data,
                timestamp: new Date().toISOString()
            })

            await driver.sleep(500);

            testResult.result = 'Passed';
            await csvWriter.writeRecords(details);
            console.log('test result saved to csv file ')




        } catch (error) {

            console.log('error during test execution ', error);
            testResult.result = 'Failed ';
            await csvWriter.writeRecords([testResult]);


        }

        finally {
            await driver.quit();
        }



    })


    it( " 05 Create ticket   ", async function () {

        let driver = await new Builder().forBrowser("chrome").build();
        await driver.manage().window().maximize();

        let testResult = {
            testCase: ' 05 Create ticket  ',
            inputValue: "   ",
            result: 'Failed ',
            timestamp: new Date().toISOString()
        };

        try {

            await driver.get("https://www.woodenstreet.com/help-center");

            // await driver.wait(until.elementLocated(By.id("loginclose1")), 14000);
    
    
            await driver.findElement(By.className("ticket-btn")).click();
            //click on track order 

            let ticket= ["acharyaabhinandan41@gmail.com", "passnew"]
            await driver.wait(until.elementLocated(By.id("login_email")), 5000);
            await driver.findElement(By.id("login_email")).sendKeys(ticket[0], Key.RETURN);
            await driver.findElement(By.id("password")).sendKeys(ticket[1], Key.RETURN)
    
            await driver.sleep(6000);
    
            await driver.wait(until.elementLocated(By.className('ticket-btn')), 10000);
    
            await driver.findElement(By.className('ticket-btn')).click();
    
            await driver.sleep(2000);
    
            await driver.wait(until.elementLocated(By.className("form-control issueType")), 10000);
    
            await driver.findElement(By.className("form-control issueType")).click();
    
    
            await driver.sleep(2000);
    
            await driver.wait(until.elementLocated(By.css("#tab1 > div:nth-child(2) > select > option:nth-child(2)")), 10000);
    
            await driver.findElement(By.css("#tab1 > div:nth-child(2) > select > option:nth-child(2)")).click();
    
    
            await driver.sleep(1000);
    
            await driver.wait(until.elementLocated(By.className("OderClick form-control")), 10000);
    
            await driver.findElement(By.className("OderClick form-control")).click();
    
            await driver.sleep(2000);
    
            await driver.wait(until.elementLocated(By.className("checkbox")), 10000);
    
            await driver.findElement(By.className("checkbox")).click();
    
            await driver.sleep(2000);
    
            await driver.wait(until.elementLocated(By.className("btn apply apply-Btn")), 10000);
    
            await driver.findElement(By.className("btn apply apply-Btn")).click();
    
            await driver.sleep(2000);
    
            await driver.wait(until.elementLocated(By.css("#tab1 > div:nth-child(4) > textarea")), 10000);
    
            await driver.findElement(By.css("#tab1 > div:nth-child(4) > textarea")).sendKeys("message", Key.RETURN);
    
    
            await driver.sleep(2000);
    
            await driver.findElement(By.className("btn ticketFormbtn")).click();
    
    
            await driver.sleep(10000);
    
            // Find all product elements    #article_76095 > div.proud-box > div.price > strong
            const productElements = await driver.findElements(By.css("body > section.myOrders.MyChat > div > section > ul"));
    
            // Extract text from each product element
            let productNames = [];
            for (let product of productElements) {
                let productName = await product.getText();
                productNames.push(productName);
            }
    
            console.log('Ticket Details:', productNames);
    
    
            const messageElements = await driver.findElements(By.className("zd-comment"));
    
            // Extract text from each product element
            let messageNames = [];
            for (let message of messageElements) {
                let messageName = await message.getText();
                messageNames.push(messageName);
            }
    
            console.log('All messages:', messageNames);

            let details = [];
            details.push({
                testCase: " 05 Create ticket  ",
                inputValue: `Email: ${ticket[0]  },  password: ${ticket[1]}`,
                result: ` 'Ticket details: ${productNames} ', ' Ticket message : ${messageNames} ' `,
                timestamp: new Date().toISOString()
            })

            testResult.result = 'Passed';
            await csvWriter.writeRecords(details);
            console.log('test result saved to csv file ')




        } catch (error) {

            console.log('error during test execution ', error);
            testResult.result = 'Failed ';
            await csvWriter.writeRecords([testResult]);


        }

        finally {
            await driver.quit();
        }



    })

    //06 view ticket 

    it(" 06 view ticket   ", async function () {

        let driver = await new Builder().forBrowser("chrome").build();
        await driver.manage().window().maximize();

        let testResult = {
            testCase: '  06 view all creaed  ticket    ',
            inputValue: "   ",
            result: 'Failed ',
            timestamp: new Date().toISOString()
        };

        try {


            await driver.get("https://www.woodenstreet.com/help-center");
            await driver.sleep(500);

            // await driver.wait(until.elementLocated(By.id("loginclose1")), 14000);
    
    
            await driver.findElement(By.className("ticket-btn")).click();
            await driver.sleep(500);
            //click on track order 
            await driver.wait(until.elementLocated(By.id("login_email")), 5000);
            let ticket= ["acharyaabhinandan41@gmail.com", "passnew"]

            await driver.findElement(By.id("login_email")).sendKeys(ticket[0], Key.RETURN);
            await driver.findElement(By.id("password")).sendKeys(ticket[1], Key.RETURN)
    
            await driver.sleep(4000);
    
            //click on create ticket 
    
            await driver.wait(until.elementLocated(By.css("body > section.SupportDesk > div > div.find > a")), 10000);
    
            await driver.findElement(By.css("body > section.SupportDesk > div > div.find > a")).click();
    
            await driver.sleep(2000);
    
            //click on view ticket 
    
            await driver.wait(until.elementLocated(By.className("ticketList")), 10000);
    
            await driver.findElement(By.className("ticketList")).click();
    
    
    
            await driver.sleep(10000);  
           
    
    
    
            // Find all product elements    #article_76095 > div.proud-box > div.price > strong
            const productElements = await driver.findElements(By.className("table"));
    
            // Extract text from each product element
            let productNames = [];
            for (let product of productElements) {
                let productName = await product.getText();
                productNames.push(productName);
            }
            

            let details = [];
            details.push({
                testCase: " 06 view all creaed  ticket  ",
                inputValue: `Email: ${ticket[0]  },  password: ${ticket[1]}`,
                result: ` ' view all Ticket : ${productNames} ' `,
                timestamp: new Date().toISOString()
            })

            testResult.result = 'Passed';
            await csvWriter.writeRecords(details);
            console.log('test result saved to csv file ')




        } catch (error) {

            console.log('error during test execution ', error);
            testResult.result = 'Failed ';
            await csvWriter.writeRecords([testResult]);


        }

        finally {
            await driver.quit();
        }



    })
// 07 call back form 





    
    it(" 07 call back form   ", async function () {

        let driver = await new Builder().forBrowser("chrome").build();
        await driver.manage().window().maximize();

        let testResult = {
            testCase: ' 07 call back form  ',
            inputValue: "   ",
            result: 'Failed ',
            timestamp: new Date().toISOString()
        };

        try {

            await driver.get("https://www.woodenstreet.com/");

            await driver.sleep(800);

            // await driver.wait(until.elementLocated(By.id("loginclose1")), 11000);
        
           
            // await driver.findElement(By.id("loginclose1")).click();

            let inputValue= [   "tester",  "tester",  "tester1@gmail.com", 9314444747,   312604,   "this is testing of form"]

    
            await driver.findElement(By.className("request-call fix-custombtn fix-reqcall")).click();
            await driver.wait(until.elementLocated(By.id("request_name")), 1000);
            await driver.findElement(By.id("request_name")).sendKeys(inputValue[0], Key.RETURN);
            await driver.findElement(By.id("request_lname")).sendKeys(inputValue[1], Key.RETURN);
            await driver.findElement(By.id("request_email")).sendKeys(inputValue[2], Key.RETURN);
            await driver.findElement(By.id("request_phone")).sendKeys(inputValue[3], Key.RETURN);
            await driver.findElement(By.id("request_pincode")).sendKeys(inputValue[4], Key.RETURN);
            await driver.findElement(By.id("request_message")).sendKeys(inputValue[5], Key.RETURN);
    
            
            await driver.findElement(By.className("orange-btn feedbackFromBtn")).click();

            await driver.sleep(2000);
            
    
    
    
            // Find all product elements    #article_76095 > div.proud-box > div.price > strong
            const productElements = await driver.findElements(By.css("#request-call-back > div.thanku-success-msg > span"));
    
            // Extract text from each product element
            let productNames = [];
            for (let product of productElements) {
                let productName = await product.getText();
                productNames.push(productName);

                console.log(productNames)
            }
            

            let details = [];
            details.push({
                testCase: " 07 call back form    ",
                inputValue: ` "first name : ${inputValue[0]}" , "last name : ${inputValue[1]}" , "Email : ${inputValue[2]}" , "Mobile no. : ${inputValue[3]}" , "pincode  : ${inputValue[4]}" , " Message  : ${inputValue[5]}" ,  `,
                result: ` '   ${productNames} ' `,
                timestamp: new Date().toISOString()
            })

            testResult.result = 'Passed';
            await csvWriter.writeRecords(details);
            console.log('test result saved to csv file ')




        } catch (error) {

            console.log('error during test execution ', error);
            testResult.result = 'Failed ';
            await csvWriter.writeRecords([testResult]);


        }

        finally {
            await driver.quit();
        }



    })


    it(" 08 Custom furniture lead   ", async function () {

        let driver = await new Builder().forBrowser("chrome").build();
        await driver.manage().window().maximize();

        let testResult = {
            testCase: ' 08 Custom furniture lead  ',
            inputValue: "   ",
            result: 'Failed ',
            timestamp: new Date().toISOString()
        };

        try {

            await driver.get("https://www.woodenstreet.com/custom-furniture");

            // await driver.wait(until.elementLocated(By.id("loginclose1")), 11000);


            // await driver.findElement(By.id("loginclose1")).click();

            let inputValue = ["tester", "tester", "tester1@gmail.com", 9314444747, 312604, "this is testing of form"]

            await driver.get("https://www.woodenstreet.com/custom-furniture");
            await driver.findElement(By.className("custm-btn")).click();
            await driver.wait(until.elementLocated(By.css("#popup_form > div:nth-child(4) > input")), 1000);
            await driver.findElement(By.css("#popup_form > div:nth-child(4) > input")).sendKeys(inputValue[0], Key.RETURN);
            await driver.findElement(By.css("#popup_form > div:nth-child(5) > input")).sendKeys(inputValue[2], Key.RETURN);
            await driver.findElement(By.css("#popup_form > div:nth-child(6) > input")).sendKeys(inputValue[3], Key.RETURN);
            await driver.findElement(By.css("#custom_pincode")).sendKeys(inputValue[4], Key.RETURN);
            await driver.findElement(By.css("#popup_form > div:nth-child(8) > textarea")).sendKeys(inputValue[5], Key.RETURN);
            await driver.findElement(By.id('formSubmitCustom')).click();

            await driver.sleep(2000);

            let message =  ["#thanksMsgCommon > div > span" , "#thanksMsgCommon > div > p "];


            let productNames = [];
            for (let index = 0; index < message.length; index++) {
                const element = message[index];


                // Find all product elements    #article_76095 > div.proud-box > div.price > strong
                const productElements = await driver.findElements(By.css( element));

                // Extract text from each product element
                
                for (let product of productElements) {
                    let productName = await product.getText();
                    productNames.push(productName);

                    console.log(productNames)
                }


            }


            let details = [];
            details.push({
                testCase: "08 Custom furniture lead   ",
                inputValue: ` "first name : ${inputValue[0]}" , "Email : ${inputValue[2]}" , "Mobile no. : ${inputValue[3]}" , "pincode  : ${inputValue[4]}" , " Message  : ${inputValue[5]}" ,  `,
                result: ` '   ${productNames} ' `,
                timestamp: new Date().toISOString()
            })

            testResult.result = 'Passed';
            await csvWriter.writeRecords(details);
            console.log('test result saved to csv file ')




        } catch (error) {

            console.log('error during test execution ', error);
            testResult.result = 'Failed ';
            await csvWriter.writeRecords([testResult]);


        }

        finally {
            await driver.quit();
        }



    })

    //09 franchisee testing 

    it(" 09 furniture franchisee lead   ", async function () {

        let driver = await new Builder().forBrowser("chrome").build();
        await driver.manage().window().maximize();

        let testResult = {
            testCase: '09 furniture franchisee lead   ',
            inputValue: "   ",
            result: 'Failed ',
            timestamp: new Date().toISOString()
        };

        try {

            await driver.get("https://www.woodenstreet.com/furniture-franchise");
            // await driver.executeScript('window.scrollBy(0, 1000);');


            // await driver.wait(until.elementLocated(By.id("loginclose1")), 11000);


            // await driver.findElement(By.id("loginclose1")).click();

            let inputValue = ["tester", "tester", "tester1@gmail.com", 9314444747, 312604, "this is testing of form", "Udaipur"]

            


                await driver.wait(until.elementLocated(By.css("#franchise > div.basic-detail-form > div:nth-child(1) > input")), 3000);
                await driver.findElement(By.css("#franchise > div.basic-detail-form > div:nth-child(1) > input")).sendKeys(inputValue[0], Key.RETURN);
                await driver.findElement(By.css("#franchise > div.basic-detail-form > div:nth-child(2) > input")).sendKeys(inputValue[2], Key.RETURN);

                await driver.findElement(By.css("#franchise > div.basic-detail-form > div:nth-child(3) > input")).sendKeys(inputValue[3], Key.RETURN);

                await driver.findElement(By.css("#franchise > div.basic-detail-form > div:nth-child(4) > input")).sendKeys(inputValue[6], Key.RETURN);
                await driver.findElement(By.css("#franchise > div.basic-detail-form > div.field.occupation > textarea")).sendKeys(inputValue[5], Key.RETURN);

                await driver.findElement(By.css("#franchise > div.basic-detail-form > div:nth-child(7) > textarea")).sendKeys(inputValue[5], Key.RETURN);

                await driver.findElement(By.id("submit")).click();

                // Add further steps to handle password entry, submit button, etc. if required
                await driver.sleep(13000);

                

                // await driver.wait(until.elementLocated(By.css("body > div.thanku-success-msg > span")), 10000);
                let message = ["body > div.thanku-success-msg > span", "body > div.thanku-success-msg > p "];  


                let productNames = [];
                for (let index = 0; index < message.length; index++) {
                    const element = message[index];


                    // Find all product elements    #article_76095 > div.proud-box > div.price > strong
                    const productElements = await driver.findElements(By.css(element));

                    // Extract text from each product element

                    for (let product of productElements) {
                        let productName = await product.getText();
                        productNames.push(productName);

                        console.log(productNames)
                    }


                }


                let details = [];
                details.push({
                    testCase: " 09 furniture franchisee lead  ",
                    inputValue: ` "first name : ${inputValue[0]}" , "Email : ${inputValue[2]}" , "Mobile no. : ${inputValue[3]}" , "pincode  : ${inputValue[6]}" , " city  : ${inputValue[5]}" ,   "message : ${inputValue[5]} `,
                    result: ` '   ${productNames} ' `,
                    timestamp: new Date().toISOString()
                })

                testResult.result = 'Passed';
                await csvWriter.writeRecords(details);
                console.log('test result saved to csv file ')




            } catch (error) {

                console.log('error during test execution ', error);
                testResult.result = 'Failed ';
                await csvWriter.writeRecords([testResult]);


            }

            finally {
                await driver.quit();
            }



        })


        //10 Hotel furniture form 

        it(" 10 Hotel furniture lead form   ", async function () {

            let driver = await new Builder().forBrowser("chrome").build();
            await driver.manage().window().maximize();
    
            let testResult = {
                testCase: '10 Hotel furniture lead form   ',
                inputValue: "   ",
                result: 'Failed ',
                timestamp: new Date().toISOString()
            };
    
            try {
    
                await driver.get("https://www.woodenstreet.com/hotel-furniture");
                await driver.executeScript('window.scrollBy(0, 1000);');
    
                await driver.findElement(By.className("commonBtn")).click();
    
                let inputValue = ["tester", "tester", "tester1@gmail.com", 9314444747, 312604, "Testing by ARP", "Udaipur" ,200]
    
                await driver.wait(until.elementLocated(By.id("hotel_interior_request_name")), 3000);
                await driver.findElement(By.id("hotel_interior_request_name")).sendKeys( inputValue[0], Key.RETURN);
                await driver.findElement(By.id("hotel_interior_request_phone")).sendKeys(inputValue[3], Key.RETURN);
    
                await driver.findElement(By.id("hotel_interior_request_email")).sendKeys(inputValue[2], Key.RETURN);
    
                await driver.findElement(By.id("hotel_interior_request_pincode")).sendKeys(inputValue[4], Key.RETURN);
                await driver.findElement(By.id("hotel_interior_request_noroom")).sendKeys(inputValue[7], Key.RETURN);
    
    
                await driver.findElement(By.id('hotel_interior_request_stage')).click();
                await driver.sleep(500);
    
                await driver.findElement(By.css("#hotel_interior_request_stage > option:nth-child(3)")).click();
    
    
    
    
    
                await driver.findElement(By.id("message")).sendKeys(inputValue[5], Key.RETURN);
    
    
    
                await driver.sleep(500);
    
                await driver.findElement(By.className("contactBtn")).click();
    
                await driver.sleep(3000);
    
    
    
                // await driver.wait(until.elementLocated(By.css("body > div.thanku-success-msg > span")), 10000);
                let message = ["body > div:nth-child(78) > table > tbody > tr > td > div > span", "body > div:nth-child(78) > table > tbody > tr > td > div > a "];
    
    
                let productNames = [];
                for (let index = 0; index < message.length; index++) {
                    const element = message[index];
    
    
                    // Find all product elements    #article_76095 > div.proud-box > div.price > strong
                    const productElements = await driver.findElements(By.css(element));
    
                    await driver.sleep(500);
    
                    // Extract text from each product element
    
                    for (let product of productElements) {
                        let productName = await product.getText();
                        productNames.push(productName);
    
                        console.log(productNames)
                    }
    
    
                }
    
    
                let details = [];
                details.push({
                    testCase: " 10  Hotel furniture  lead  ",
                    inputValue: ` "Full name : ${inputValue[0]}" ,  "Mobile no. : ${inputValue[3]}" ,  "Email : ${inputValue[2]}" ,  "pincode  : ${inputValue[4]}" , " Roo, No.  : ${inputValue[7]}" ,   "message : ${inputValue[5]} `,
                    result: ` '   ${productNames} ' `,
                    timestamp: new Date().toISOString()
                })
    
                testResult.result = 'Passed';
                await csvWriter.writeRecords(details);
                console.log('test result saved to csv file ')
    
    
    
    
            } catch (error) {
    
                console.log('error during test execution ', error);
                testResult.result = 'Failed ';
                await csvWriter.writeRecords([testResult]);
    
    
            }
    
            finally {
                await driver.quit();
            }
    
    
    
        })
    
    
//11 Media form 


it(" 11 media  lead form   ", async function () {

    let driver = await new Builder().forBrowser("chrome").build();
    await driver.manage().window().maximize();

    let testResult = {
        testCase: '11 media  lead form   ',
        inputValue: "   ",
        result: 'Failed ',
        timestamp: new Date().toISOString()
    };

    try {

        await driver.get("https://www.woodenstreet.com/media");


        await driver.sleep(200);

        let inputValue = ["tester", "tester", "tester1@gmail.com", 9314444747, 312604, "Testing by ARP", "Udaipur", 200];

        await driver.findElement(By.className("btn media-btn")).click();

        await driver.wait(until.elementLocated(By.id("firstname")), 3000);
        await driver.findElement(By.id("firstname")).sendKeys(inputValue[0], Key.RETURN);
        await driver.findElement(By.id("email")).sendKeys(inputValue[2], Key.RETURN);
        await driver.findElement(By.id("phone")).sendKeys(inputValue[3], Key.RETURN);

        await driver.findElement(By.id("message")).sendKeys(inputValue[5], Key.RETURN);

        await driver.findElement(By.id("media-enquiry")).click();

        await driver.sleep(500);



        let message = ["#thanksMsgCommon > div > span", "#thanksMsgCommon > div > a"];
        let productNames = [];
        for (let index = 0; index < message.length; index++) {
            const element = message[index];
            // Find all product elements    #article_76095 > div.proud-box > div.price > strong
            const productElements = await driver.findElements(By.css(element));
            await driver.sleep(500);
            // Extract text from each product element
            for (let product of productElements) {
                let productName = await product.getText();
                productNames.push(productName);
                console.log(productNames)
            }
        }
        let details = [];
        details.push({
            testCase: " 11  Media   lead  ",
            inputValue: ` "Full name : ${inputValue[0]}" ,     "Email : ${inputValue[2]}" , "Mobile no. : ${inputValue[3]}" ,   "message : ${inputValue[5]} `,
            result: ` '   ${productNames} ' `,
            timestamp: new Date().toISOString()
        })

        testResult.result = 'Passed';
        await csvWriter.writeRecords(details);
        console.log('test result saved to csv file ')
    } catch (error) {

        console.log('error during test execution ', error);
        testResult.result = 'Failed ';
        await csvWriter.writeRecords([testResult]);
    }

    finally {
        await driver.quit();
    }

})



it(" 12 Notify lead form    ", async function () {

    let driver = await new Builder().forBrowser("chrome").build();
    await driver.manage().window().maximize();

    let testResult = {
        testCase: ' 12 Notify lead form ',
        inputValue: "   ",
        result: 'Failed ',
        timestamp: new Date().toISOString()
    };

    try {

        await driver.get("https://www.woodenstreet.com/product/henry-3-seater-sofa-velvet-chestnut-brown");


        // await driver.wait(until.elementLocated(By.id("loginclose1")), 15000);


        // await driver.findElement(By.id("loginclose1")).click();

        await driver.sleep(1000)

        await driver.wait(until.elementLocated(By.css("body > main > div.mainDetail > p:nth-child(6) > a")), 6000);

        await driver.findElement(By.css("body > main > div.mainDetail > p:nth-child(6) > a")).click();
        await driver.wait(until.elementLocated(By.css("#price-drop-from > div:nth-child(3) > input")), 6000);

        await driver.findElement(By.css("#price-drop-from > div:nth-child(3) > input")).sendKeys("Tester", Key.RETURN);
        await driver.findElement(By.css("#price-drop-from > div:nth-child(4) > input")).sendKeys(9314444747, Key.RETURN);
        await driver.findElement(By.css("#price-drop-from > div:nth-child(5) > input")).sendKeys(1231, Key.RETURN);

        //#price-drop-from > button  ,,   subtitle
        await driver.findElement(By.css("#price-drop-from > button")).click();


        await driver.sleep(3000);

        // Find all product elements    #article_76095 > div.proud-box > div.price > strong
        const productElements = await driver.findElements(By.className("subtitle"));

       

        


        let message = ["subtitle", "submit-btn swpmodal-close"];
        let productNames = [];
        for (let index = 0; index < message.length; index++) {
            const element = message[index];
            // Find all product elements    #article_76095 > div.proud-box > div.price > strong
            const productElements = await driver.findElements(By.className(element));
            await driver.sleep(500);
            // Extract text from each product element
            for (let product of productElements) {
                let productName = await product.getText();
                productNames.push(productName);
                console.log(productName)
            }
        }
        let details = [];
        details.push({
            testCase: "  12 Notify lead form    ",
            inputValue: ` "Full name : Tester" , "Mobile no. : 9314444747 " ,   "Price : 3000 " `,
            result: ` '   ${productNames} ' `,
            timestamp: new Date().toISOString()
        })

        testResult.result = 'Passed';
        await csvWriter.writeRecords(details);
        console.log('test result saved to csv file ')
    } catch (error) {

        console.log('error during test execution ', error);
        testResult.result = 'Failed ';
        await csvWriter.writeRecords([testResult]);
    }

    finally {
        // await driver.sleep(1000);
        await driver.quit();
    }

})



    after(async function () {
        // Optionally, perform any cleanup here
    });
});