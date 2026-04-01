"""
Azure OpenAI service for LLM interactions.
"""

from fastapi import HTTPException
from openai import AsyncAzureOpenAI
from typing import List, Dict, Any, Optional
from loguru import logger
import tiktoken
from langfuse import observe, Langfuse

from config import settings


class AzureOpenAIService:
    """Service for interacting with Azure OpenAI."""
    
    # Map Azure deployment names to standard models for Langfuse cost tracking
    MODEL_MAPPING = {
        "gpt-5.2-chat": "gpt-4o",
        "gpt-4o": "gpt-4o",
        "gpt-4": "gpt-4",
        "gpt-35-turbo": "gpt-3.5-turbo",
        "text-embedding-3-small": "text-embedding-3-small"
    }
    
    def __init__(self):
        """Initialize Azure OpenAI clients (separate for chat and embeddings)."""
        # Chat/LLM client with standard AsyncAzureOpenAI (intercepted by MLflow)
        self.client = AsyncAzureOpenAI(
            azure_endpoint=settings.azure_openai_endpoint,
            api_key=settings.azure_openai_key,
            api_version=settings.azure_openai_api_version,
            max_retries=3  # Add resilience for transient endpoint errors
        )
        self.deployment = settings.azure_openai_deployment
        
        # Embedding client with standard AsyncAzureOpenAI (intercepted by MLflow)
        self.embedding_client = AsyncAzureOpenAI(
            azure_endpoint=settings.azure_openai_embedding_endpoint,
            api_key=settings.azure_openai_embedding_key,
            api_version=settings.azure_openai_api_version,
            max_retries=3
        )
        self.embedding_deployment = settings.azure_openai_embedding_deployment
        
        self.encoding = tiktoken.encoding_for_model("gpt-4")
        
        # DALL-E client (usually same endpoint as chat, but different deployment)
        self.dalle_deployment = settings.azure_openai_dalle_deployment

        # Initialize Langfuse client for manual observations if needed
        self.langfuse = Langfuse()
    
    async def chat_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 1,
        max_completion_tokens: int = 2000,
        response_format: Optional[Dict[str, str]] = None,
        return_full_response: bool = False
    ) -> Any:
        """Generate chat completion using Azure OpenAI with cost mapping."""
        try:
            kwargs = {
                "model": self.deployment,
                "messages": messages,
                "temperature": temperature,
            }
            if response_format:
                kwargs["response_format"] = response_format
            
            logger.debug(f"Attempting Azure OpenAI chat completion for {self.deployment}")
            
            # Determine base model for Langfuse cost calculation
            langfuse_model = self.MODEL_MAPPING.get(self.deployment, "gpt-4o")
            
            # Use manual generation observation to ensure cost mapping works for Azure
            # The Langfuse OpenAI wrapper often struggles with Azure deployment names for cost.
            with self.langfuse.start_as_current_observation(
                name="Azure OpenAI Chat",
                as_type="generation",
                model=langfuse_model,
                input=messages,
                metadata={"deployment": self.deployment}
            ) as generation:
                # Try with max_completion_tokens first (modern GPT models)
                try:
                    kwargs["max_completion_tokens"] = max_completion_tokens
                    response = await self.client.chat.completions.create(**kwargs)
                except Exception as e:
                    error_msg = str(e)
                    # Check for temperature restrictions
                    if "temperature" in error_msg and ("not support" in error_msg or "only the default" in error_msg.lower()):
                        logger.warning(f"Temperature {kwargs.get('temperature')} not supported, falling back to temperature=1")
                        kwargs["temperature"] = 1
                        response = await self.client.chat.completions.create(**kwargs)
                    # Fallback to max_completion_tokens if max_completion_tokens is not supported
                    elif "max_completion_tokens" in error_msg or "unexpected keyword" in error_msg.lower():
                        logger.debug("Falling back to max_completion_tokens")
                        kwargs.pop("max_completion_tokens", None)
                        kwargs["max_completion_tokens"] = max_completion_tokens
                        response = await self.client.chat.completions.create(**kwargs)
                    else:
                        raise e
                
                # Update the generation with result and usage
                generation.update(
                    output=response.choices[0].message.content,
                    usage_details={
                        "input": response.usage.prompt_tokens,
                        "output": response.usage.completion_tokens,
                        "total": response.usage.total_tokens
                    }
                )
            
            if return_full_response:
                return response
            return response.choices[0].message.content
        
        except Exception as e:
            error_msg = str(e)
            if "Connection error" in error_msg:
                detailed_msg = f"Failed to connect to Azure OpenAI at {settings.azure_openai_endpoint}. Please check if the endpoint URL and API key are correct in your .env file."
                logger.error(detailed_msg)
                raise HTTPException(
                    status_code=502,
                    detail=detailed_msg
                )
            logger.error(f"Error in chat completion: {error_msg}")
            raise
    
    @observe()
    async def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding for text with cost mapping."""
        try:
            # Ensure input is a string and sanitize
            if isinstance(text, list):
                text = text[0] if text else ""
            
            # Replace newlines
            text = text.replace("\n", " ")
            
            langfuse_model = self.MODEL_MAPPING.get(self.embedding_deployment, "text-embedding-3-small")
            
            with self.langfuse.start_as_current_observation(
                name="Azure OpenAI Embedding",
                as_type="generation",
                model=langfuse_model,
                input=text,
                metadata={"deployment": self.embedding_deployment}
            ) as generation:
                response = await self.embedding_client.embeddings.create(
                    model=self.embedding_deployment,
                    input=[text]
                )
                
                generation.update(
                    usage_details={
                        "input": response.usage.prompt_tokens,
                        "total": response.usage.total_tokens
                    }
                )
                return response.data[0].embedding

        except Exception as e:
            logger.error(f"Error generating embedding: {str(e)}")
            raise

    async def generate_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for a batch of texts with cost mapping."""
        try:
            # Sanitize texts
            sanitized_texts = [t.replace("\n", " ") for t in texts]
            
            langfuse_model = self.MODEL_MAPPING.get(self.embedding_deployment, "text-embedding-3-small")
            
            with self.langfuse.start_as_current_observation(
                name="Azure OpenAI Batch Embedding",
                as_type="generation",
                model=langfuse_model,
                input=f"Batch of {len(texts)} texts",
                metadata={"deployment": self.embedding_deployment}
            ) as generation:
                response = await self.embedding_client.embeddings.create(
                    model=self.embedding_deployment,
                    input=sanitized_texts
                )
                
                generation.update(
                    usage_details={
                        "input": response.usage.prompt_tokens,
                        "total": response.usage.total_tokens
                    }
                )
                return [data.embedding for data in response.data]
        except Exception as e:
            logger.error(f"Error generating batch embeddings: {str(e)}")
            # Fallback to individual
            results = []
            for text in texts:
                emb = await self.generate_embedding(text)
                results.append(emb)
            return results

    async def generate_structured_output(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 1
    ) -> str:
        """
        Generate structured JSON output.
        
        Args:
            system_prompt: System instruction
            user_prompt: User query
            temperature: Sampling temperature
        
        Returns:
            JSON string response
        """
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        return await self.chat_completion(
            messages=messages,
            temperature=temperature,
            max_completion_tokens=4000, # Increased for complex SVG/Json structures
            response_format={"type": "json_object"}
        )
    
    def count_tokens(self, text: str) -> int:
        """
        Count tokens in text.
        
        Args:
            text: Input text
        
        Returns:
            Number of tokens
        """
        return len(self.encoding.encode(text))
    
    async def stream_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 1,
        max_completion_tokens: int = 2000
    ):
        """
        Stream chat completion.
        
        Args:
            messages: List of message dictionaries
            temperature: Sampling temperature
            max_completion_tokens: Maximum tokens
        
        Yields:
            Chunks of generated text
        """
        try:
            kwargs = {
                "model": self.deployment,
                "messages": messages,
                "temperature": temperature,
                "stream": True
            }
            
            # Try with max_completion_tokens first (GPT-5.x models)
            try:
                kwargs["max_completion_tokens"] = max_completion_tokens
                stream = await self.client.chat.completions.create(**kwargs)
            except (TypeError, Exception) as e:
                error_msg = str(e)
                
                # Check if it's a parameter compatibility issue
                if "max_completion_tokens" in error_msg and ("not supported" in error_msg or "unexpected keyword" in error_msg):
                    # Library doesn't support max_completion_tokens, try max_completion_tokens
                    logger.debug("max_completion_tokens not supported in streaming, trying max_completion_tokens")
                    kwargs.pop("max_completion_tokens", None)
                    kwargs["max_completion_tokens"] = max_completion_tokens
                    try:
                        stream = await self.client.chat.completions.create(**kwargs)
                    except Exception as e2:
                        error_msg2 = str(e2)
                        # Check for temperature restrictions
                        if "temperature" in error_msg2 and ("not support" in error_msg2 or "only the default" in error_msg2.lower()):
                            logger.warning(f"Temperature {kwargs.get('temperature')} not supported in streaming, using temperature=1")
                            kwargs["temperature"] = 1
                            stream = await self.client.chat.completions.create(**kwargs)
                        # If max_completion_tokens also fails, try without limit
                        elif "max_completion_tokens" in error_msg2 and "not supported" in error_msg2:
                            logger.warning("Neither max parameter supported in streaming, trying without token limit")
                            kwargs.pop("max_completion_tokens", None)
                            try:
                                stream = await self.client.chat.completions.create(**kwargs)
                            except Exception as e3:
                                if "temperature" in str(e3) and "not support" in str(e3):
                                    logger.warning("Using default temperature=1 in streaming")
                                    kwargs["temperature"] = 1
                                    stream = await self.client.chat.completions.create(**kwargs)
                                else:
                                    raise
                        else:
                            raise
                elif "max_completion_tokens" in error_msg and "not supported" in error_msg and "max_completion_tokens" in error_msg:
                    # API says use max_completion_tokens instead
                    logger.debug("max_completion_tokens not supported by API in streaming, already tried max_completion_tokens")
                    raise
                # Check for temperature restrictions
                elif "temperature" in error_msg and ("not support" in error_msg or "only the default" in error_msg.lower()):
                    logger.warning(f"Temperature {kwargs.get('temperature')} not supported in streaming, using temperature=1")
                    kwargs["temperature"] = 1
                    stream = await self.client.chat.completions.create(**kwargs)
                else:
                    # Different error, re-raise
                    raise
            
            async for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        
        except Exception as e:
            logger.error(f"Error in streaming completion: {str(e)}")
            raise


    async def generate_image(self, prompt: str) -> str:
        """
        Generate image using Azure OpenAI DALL-E 3.
        
        Args:
            prompt: Descriptive prompt for image generation
            
        Returns:
            URL of the generated image
        """
        try:
            logger.info(f"Generating DALL-E image with prompt: {prompt[:50]}...")
            
            # Using standard DALL-E 3 image generation
            # Note: Azure OpenAI DALL-E usually doesn't need 'model' in the traditional DALL-E 3 sense
            # if the client is already pointed to the correct deployment resource.
            # But we pass the deployment name just in case.
            
            with self.langfuse.start_as_current_observation(
                name="Azure OpenAI Image Generation",
                as_type="generation",
                model="dall-e-3",
                input=prompt
            ) as generation:
                response = await self.client.images.generate(
                    model=self.dalle_deployment,
                    prompt=prompt,
                    n=1,
                    size="1024x1024",
                    quality="standard"
                )
                
                image_url = response.data[0].url
                generation.update(output=image_url)
                
                logger.info(f"Successfully generated DALL-E image: {image_url}")
                return image_url
                
        except Exception as e:
            logger.error(f"Error in image generation: {str(e)}")
            # Fallback to a placeholder or educational illustration service if DALL-E fails
            # For now, we'll return a reliable placeholder with the prompt encoded
            return f"https://source.unsplash.com/featured/?drawing,sketch,{prompt.replace(' ', ',')}"


# Global service instance
azure_openai_service = AzureOpenAIService()
