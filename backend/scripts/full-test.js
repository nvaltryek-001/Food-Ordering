const BASE =
  process.env.API_URL ||
  "http://127.0.0.1:5000/api";


async function request(path, options = {}) {

  const response = await fetch(
    `${BASE}${path}`,
    {
      ...options,

      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    }
  );


  const text =
    await response.text();


  let data;

  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }


  if (!response.ok) {

    throw new Error(
      `${response.status} ${path}: ${text}`
    );
  }


  return data;
}


/*
============================================================
EXTRACT ID SAFELY
============================================================
*/

function getId(value) {

  if (!value) {
    return null;
  }


  if (
    typeof value === "string"
  ) {
    return value;
  }


  return (
    value._id ||
    value.id ||
    value.foodId ||
    value.food?._id ||
    value.food?.id ||
    null
  );
}


/*
============================================================
MAIN
============================================================
*/

async function main() {

  console.log("");
  console.log("============================================");
  console.log("FoodSense AI END-TO-END TEST");
  console.log("============================================");


  /*
  ==========================================================
  1. HEALTH
  ==========================================================
  */

  console.log("\n1. Health");


  const health =
    await request("/health");


  console.log(
    "PASS",
    health
  );


  /*
  ==========================================================
  2. FOODS
  ==========================================================
  */

  console.log("\n2. Foods");


  const foodsResponse =
    await request("/foods");


  console.log(
    "Foods API response type:",
    typeof foodsResponse
  );


  /*
  ----------------------------------------------------------
  Handle different response formats
  ----------------------------------------------------------
  */

  let foods;


  if (
    Array.isArray(
      foodsResponse
    )
  ) {

    foods =
      foodsResponse;

  }

  else if (
    Array.isArray(
      foodsResponse.foods
    )
  ) {

    foods =
      foodsResponse.foods;

  }

  else if (
    Array.isArray(
      foodsResponse.data
    )
  ) {

    foods =
      foodsResponse.data;

  }

  else {

    throw new Error(
      "Unable to find foods array in /foods response."
    );
  }


  if (
    foods.length === 0
  ) {

    throw new Error(
      "Foods API returned zero foods."
    );
  }


  const food =
    foods[0];


  console.log(
    "Food object:"
  );

  console.log(
    JSON.stringify(
      food,
      null,
      2
    )
  );


  const foodId =
    getId(food);


  if (!foodId) {

    throw new Error(
      "Food ID could not be extracted."
    );
  }


  console.log(
    "PASS food:",
    food.name
  );


  console.log(
    "PASS foodId:",
    foodId
  );


  /*
  ==========================================================
  3. CUSTOMER REGISTRATION
  ==========================================================
  */

  console.log(
    "\n3. Customer registration"
  );


  const email =
    `test_${Date.now()}@foodsense.ai`;


  const password =
    "Test@12345";


  const register =
    await request(
      "/auth/register",
      {
        method: "POST",

        body: JSON.stringify({

          name:
            "FoodSense Test User",

          email,

          password

        })
      }
    );


  console.log(
    "PASS registration:",
    register.message ||
    "created"
  );


  /*
  ==========================================================
  4. CUSTOMER LOGIN
  ==========================================================
  */

  console.log(
    "\n4. Customer login"
  );


  const login =
    await request(
      "/auth/login",
      {
        method: "POST",

        body: JSON.stringify({

          email,

          password

        })
      }
    );


  const token =
    login.token ||
    login.accessToken;


  if (!token) {

    throw new Error(
      "Customer JWT token missing."
    );
  }


  console.log(
    "PASS JWT received"
  );


  const authHeaders = {

    Authorization:
      `Bearer ${token}`

  };


  /*
  ==========================================================
  5. CREATE ORDER
  ==========================================================
  */

  console.log(
    "\n5. Create order"
  );


  /*
  IMPORTANT:
  Send the EXACT MongoDB food ID
  */

  const orderPayload = {

    items: [

      {

        foodId:
          String(foodId),

        quantity:
          1

      }

    ],

    paymentMethod:
      "demo",

    paymentStatus:
      "paid",

    tableNumber:
      "1"

  };


  console.log(
    "Order payload:"
  );


  console.log(
    JSON.stringify(
      orderPayload,
      null,
      2
    )
  );


  const orderResponse =
    await request(
      "/orders",
      {

        method: "POST",

        headers:
          authHeaders,

        body:
          JSON.stringify(
            orderPayload
          )

      }
    );


  console.log(
    "PASS order created"
  );


  console.log(
    JSON.stringify(
      orderResponse,
      null,
      2
    )
  );


  const order =
    orderResponse.order ||
    orderResponse;


  const orderId =
    getId(order);


  if (!orderId) {

    throw new Error(
      "Order ID missing."
    );
  }


  console.log(
    "PASS orderId:",
    orderId
  );


  /*
  ==========================================================
  6. MY ORDERS
  ==========================================================
  */

  console.log(
    "\n6. Customer orders"
  );


  const myOrders =
    await request(
      "/orders/my",
      {
        headers:
          authHeaders
      }
    );


  console.log(
    "PASS orders returned"
  );


  /*
  ==========================================================
  7. MANAGER LOGIN
  ==========================================================
  */

  console.log(
    "\n7. Manager login"
  );


  const managerLogin =
    await request(
      "/auth/login",
      {

        method:
          "POST",

        body:
          JSON.stringify({

            email:
              "manager@foodsense.ai",

            password:
              "Manager@123"

          })

      }
    );


  const managerToken =
    managerLogin.token ||
    managerLogin.accessToken;


  if (!managerToken) {

    throw new Error(
      "Manager JWT missing."
    );
  }


  const managerHeaders = {

    Authorization:
      `Bearer ${managerToken}`

  };


  console.log(
    "PASS manager login"
  );


  /*
  ==========================================================
  8. MANAGER STATUS
  ==========================================================
  */

  const statuses = [

    "accepted",

    "preparing",

    "served"

  ];


  for (
    const status of statuses
  ) {

    console.log(
      `\n8. Manager -> ${status}`
    );


    const result =
      await request(
        `/orders/${orderId}/status`,
        {

          method:
            "PATCH",

          headers:
            managerHeaders,

          body:
            JSON.stringify({
              status
            })

        }
      );


    console.log(
      "PASS",
      status
    );


    console.log(
      result.message ||
      ""
    );
  }


  /*
  ==========================================================
  9. REVIEW
  ==========================================================
  */

  console.log(
    "\n9. Review"
  );


  const review =
    await request(
      "/reviews",
      {

        method:
          "POST",

        headers:
          authHeaders,

        body:
          JSON.stringify({

            orderId,

            foodId:

              String(foodId),

            rating:
              5,

            text:
              "The food was excellent, fresh and delicious."

          })

      }
    );


  console.log(
    "PASS review submitted"
  );


  console.log(
    JSON.stringify(
      review,
      null,
      2
    )
  );


  /*
  ==========================================================
  10. REVIEW ANALYTICS
  ==========================================================
  */

  console.log(
    "\n10. Review analytics"
  );


  const analytics =
    await request(
      "/reviews/analytics"
    );


  console.log(
    "PASS analytics"
  );


  console.log(
    JSON.stringify(
      analytics,
      null,
      2
    )
  );


  /*
  ==========================================================
  11. DASHBOARD
  ==========================================================
  */

  console.log(
    "\n11. Dashboard"
  );


  const dashboard =
    await request(
      "/analytics/dashboard",
      {
        headers:
          managerHeaders
      }
    );


  console.log(
    "PASS dashboard"
  );


  /*
  ==========================================================
  COMPLETE
  ==========================================================
  */

  console.log("");
  console.log("============================================");
  console.log("🎉 END-TO-END TEST PASSED");
  console.log("============================================");

}


main()
  .catch(
    error => {

      console.error("");
      console.error(
        "❌ TEST FAILED"
      );

      console.error(
        error.message
      );

      process.exit(1);

    }
  );