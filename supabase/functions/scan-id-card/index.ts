import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":
    "POST, GET, OPTIONS, PUT, DELETE",
};

serve(async (req) => {
  // =========================
  // CORS
  // =========================
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    // =========================
    // SUPABASE CLIENT
    // =========================
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get(
        "SUPABASE_SERVICE_ROLE_KEY",
      ) ?? "",
    );

    // =========================
    // REQUEST BODY
    // =========================
    const {
      imageBase64,
      eventId,
    } = await req.json();

    if (!imageBase64) {
      throw new Error(
        "Image data is required",
      );
    }

    // =========================
    // OPENAI API KEY
    // =========================
    const apiKey = Deno.env.get(
      "OPENAI_API_KEY",
    );

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: "CONFIG_ERROR",
          message:
            "OPENAI_API_KEY missing",
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type":
              "application/json",
          },
          status: 200,
        },
      );
    }

    console.log(
      "Calling OpenAI Vision...",
    );

    // =========================
    // OPENAI OCR
    // =========================
    const openaiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",

        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          model: "gpt-4o-mini",

          messages: [
            {
              role: "user",

              content: [
                {
                  type: "text",

                  text:
                    "You are an OCR assistant. Read this ID card and return ONLY the person's full name. Return only the name text and nothing else. If no name is visible return NONE.",
                },

                {
                  type: "image_url",

                  image_url: {
                    url:
                      imageBase64.startsWith(
                        "data:",
                      )
                        ? imageBase64
                        : `data:image/jpeg;base64,${imageBase64}`,
                  },
                },
              ],
            },
          ],

          max_tokens: 50,
        }),
      },
    );

    const openaiData =
      await openaiResponse.json();

    console.log(
      "OPENAI RESPONSE:",
      openaiData,
    );

    if (openaiData.error) {
      return new Response(
        JSON.stringify({
          error: "OPENAI_ERROR",
          message:
            openaiData.error.message,
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type":
              "application/json",
          },
          status: 200,
        },
      );
    }

    // =========================
    // EXTRACTED NAME
    // =========================
    const extractedName =
      openaiData?.choices?.[0]?.message?.content
        ?.trim() || "";

    console.log(
      "EXTRACTED NAME:",
      extractedName,
    );

    if (
      !extractedName ||
      extractedName === "NONE"
    ) {
      return new Response(
        JSON.stringify({
          userFound: false,

          message:
            "Could not detect a valid name from the ID card.",
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type":
              "application/json",
          },

          status: 200,
        },
      );
    }

    // =========================
    // FIND EVENT
    // =========================
    const { data: event } =
      await supabaseClient
        .from("events")
        .select("id")
        .eq("event_code", eventId)
        .single();

    if (!event) {
      throw new Error(
        `Event '${eventId}' not found`,
      );
    }

    // =========================
    // GET USERS
    // =========================
    const {
      data: users,
      error: usersError,
    } = await supabaseClient
      .from("users")
      .select("*")
      .eq("event_id", event.id);

    if (usersError) {
      console.log(
        "USERS ERROR:",
        usersError,
      );

      throw new Error(
        usersError.message,
      );
    }

    console.log(
      "TOTAL USERS:",
      users?.length,
    );

    // =========================
    // NORMALIZE TEXT
    // =========================
    const normalizeText = (
      text = "",
    ) => {
      return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, " ")
        .replace(
          /[^a-z0-9 ]/g,
          "",
        );
    };

    const cleanedExtracted =
      normalizeText(extractedName);

    console.log(
      "NORMALIZED OCR:",
      cleanedExtracted,
    );

    // =========================
    // FIND MATCH
    // =========================
    let matchedUser = null;

    for (const user of users || []) {
      const dbName = normalizeText(
        user.username,
      );

      console.log(
        "COMPARE:",
        dbName,
        "WITH",
        cleanedExtracted,
      );

      // EXACT MATCH
      if (
        dbName &&
        dbName === cleanedExtracted
      ) {
        matchedUser = user;
        break;
      }

      // PARTIAL MATCH
      if (
        dbName &&
        cleanedExtracted &&
        (dbName.includes(
          cleanedExtracted,
        ) ||
          cleanedExtracted.includes(
            dbName,
          ))
      ) {
        matchedUser = user;
        break;
      }
    }

    // =========================
    // USER FOUND
    // =========================
    if (matchedUser) {
      console.log(
        "MATCH FOUND:",
        matchedUser.username,
      );

      return new Response(
        JSON.stringify({
          userFound: true,

          user: matchedUser,

          extractedName,
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type":
              "application/json",
          },

          status: 200,
        },
      );
    }

    // =========================
    // USER NOT FOUND
    // =========================
    console.log(
      "NO MATCH FOUND",
    );

    return new Response(
      JSON.stringify({
        userFound: false,

        extractedName,

        message: `We read the name '${extractedName}', but couldn't find a matching registration.`,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type":
            "application/json",
        },

        status: 200,
      },
    );
  } catch (error) {
    console.error(
      "EDGE FUNCTION ERROR:",
      error,
    );

    return new Response(
      JSON.stringify({
        error:
          error.message ||
          "Unknown error",
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type":
            "application/json",
        },

        status: 500,
      },
    );
  }
});